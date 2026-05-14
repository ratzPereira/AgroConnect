package com.agroconnect.service;

import com.agroconnect.dto.request.RecordAdjustmentInDto;
import com.agroconnect.dto.request.RecordAdjustmentOutDto;
import com.agroconnect.dto.request.RecordPurchaseDto;
import com.agroconnect.dto.response.InventoryMovementResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.mapper.InventoryMovementMapper;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.InventoryItem;
import com.agroconnect.model.InventoryMovement;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.ServiceExecution;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.MovementType;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.InventoryItemRepository;
import com.agroconnect.repository.InventoryMovementRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * Owns the inventory ledger: appends immutable movements, recomputes the
 * weighted-average cost on inbound batches, and exposes a read API for the
 * timeline. All write methods take a row-level lock on the item so that
 * concurrent purchases/consumptions cannot race on the same product.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryMovementService {

    private static final Logger log = LoggerFactory.getLogger(InventoryMovementService.class);

    private static final String ERR_ITEM_NOT_FOUND = "Item de inventário não encontrado.";
    private static final String ERR_PROVIDER_NOT_FOUND = "Perfil de prestador não encontrado.";
    private static final String ERR_NEGATIVE_STOCK = "Stock insuficiente para esta operação.";
    private static final String ERR_USER_NOT_FOUND = "Utilizador não encontrado.";
    private static final String ERR_ITEM_DELETED = "Não é possível movimentar um item eliminado.";

    private final InventoryItemRepository inventoryItemRepository;
    private final InventoryMovementRepository inventoryMovementRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final UserRepository userRepository;

    public Page<InventoryMovementResponse> listForItem(Long itemId, Long userId, Pageable pageable) {
        ProviderProfile provider = getProviderProfile(userId);
        inventoryItemRepository.findByIdAndProviderId(itemId, provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException(ERR_ITEM_NOT_FOUND));

        return inventoryMovementRepository.findByItemIdOrderByCreatedAtDesc(itemId, pageable)
                .map(m -> InventoryMovementMapper.toResponse(m, displayNameOf(m.getActor())));
    }

    /**
     * Records the opening balance for a freshly-created item.
     * Caller must already hold the persistence context for the item.
     */
    @Transactional
    public InventoryMovement recordInitial(InventoryItem item,
                                           BigDecimal quantity,
                                           BigDecimal unitCost,
                                           Long actorUserId) {
        BigDecimal qty = InventoryMath.toQty(quantity);
        BigDecimal cost = InventoryMath.toCost(unitCost != null ? unitCost : BigDecimal.ZERO);

        item.setQuantity(qty);
        item.setCostPerUnit(cost);
        inventoryItemRepository.save(item);

        return appendMovement(new MovementSpec(item, MovementType.INITIAL, qty, cost,
                qty, cost, "Saldo inicial", null, actorUserId));
    }

    @Transactional
    public InventoryMovementResponse recordPurchase(Long itemId, RecordPurchaseDto dto, Long userId) {
        ProviderProfile provider = getProviderProfile(userId);
        InventoryItem item = lockItem(itemId, provider.getId());

        BigDecimal addedQty = InventoryMath.toQty(dto.quantity());
        BigDecimal addedCost = InventoryMath.toCost(dto.unitCost());

        BigDecimal newQty = InventoryMath.toQty(item.getQuantity().add(addedQty));
        BigDecimal newWac = InventoryMath.newWeightedAverageCost(
                item.getQuantity(), item.getCostPerUnit(), addedQty, addedCost);

        item.setQuantity(newQty);
        item.setCostPerUnit(newWac);
        inventoryItemRepository.save(item);

        InventoryMovement movement = appendMovement(new MovementSpec(item, MovementType.PURCHASE,
                addedQty, addedCost, newQty, newWac, dto.reason(), null, userId));

        log.info("PURCHASE {} of {} units @ {} on item {} (newQty={}, newWac={})",
                movement.getId(), addedQty, addedCost, itemId, newQty, newWac);
        return InventoryMovementMapper.toResponse(movement, displayNameOf(movement.getActor()));
    }

    @Transactional
    public InventoryMovementResponse recordAdjustmentIn(Long itemId, RecordAdjustmentInDto dto, Long userId) {
        ProviderProfile provider = getProviderProfile(userId);
        InventoryItem item = lockItem(itemId, provider.getId());

        BigDecimal addedQty = InventoryMath.toQty(dto.quantity());
        BigDecimal newQty = InventoryMath.toQty(item.getQuantity().add(addedQty));

        BigDecimal storedUnitCost;
        BigDecimal newWac;
        if (dto.unitCost() != null) {
            BigDecimal addedCost = InventoryMath.toCost(dto.unitCost());
            storedUnitCost = addedCost;
            newWac = InventoryMath.newWeightedAverageCost(
                    item.getQuantity(), item.getCostPerUnit(), addedQty, addedCost);
        } else {
            storedUnitCost = null;
            newWac = item.getCostPerUnit();
        }

        item.setQuantity(newQty);
        item.setCostPerUnit(newWac);
        inventoryItemRepository.save(item);

        InventoryMovement movement = appendMovement(new MovementSpec(item, MovementType.ADJUSTMENT_IN,
                addedQty, storedUnitCost, newQty, newWac, dto.reason(), null, userId));

        log.info("ADJUSTMENT_IN {} of {} units on item {} (newQty={}, newWac={})",
                movement.getId(), addedQty, itemId, newQty, newWac);
        return InventoryMovementMapper.toResponse(movement, displayNameOf(movement.getActor()));
    }

    @Transactional
    public InventoryMovementResponse recordAdjustmentOut(Long itemId, RecordAdjustmentOutDto dto, Long userId) {
        ProviderProfile provider = getProviderProfile(userId);
        InventoryItem item = lockItem(itemId, provider.getId());

        BigDecimal removedQty = InventoryMath.toQty(dto.quantity());
        ensureSufficientStock(item, removedQty);

        BigDecimal signedDelta = removedQty.negate();
        BigDecimal newQty = InventoryMath.toQty(item.getQuantity().subtract(removedQty));

        item.setQuantity(newQty);
        inventoryItemRepository.save(item);

        InventoryMovement movement = appendMovement(new MovementSpec(item, MovementType.ADJUSTMENT_OUT,
                signedDelta, null, newQty, item.getCostPerUnit(), dto.reason(), null, userId));

        log.info("ADJUSTMENT_OUT {} of {} units on item {} (newQty={})",
                movement.getId(), removedQty, itemId, newQty);
        return InventoryMovementMapper.toResponse(movement, displayNameOf(movement.getActor()));
    }

    /**
     * Records a CONSUMPTION movement triggered by a service execution.
     * Called by the execution / job-costing flow — not exposed as a public endpoint.
     */
    @Transactional
    public InventoryMovement recordConsumption(Long itemId,
                                               BigDecimal quantity,
                                               ServiceExecution execution,
                                               String reason,
                                               Long actorUserId) {
        InventoryItem item = inventoryItemRepository.findByIdForUpdate(itemId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_ITEM_NOT_FOUND));
        if (item.getDeletedAt() != null) {
            throw new InvalidStateException(ERR_ITEM_DELETED);
        }

        BigDecimal removedQty = InventoryMath.toQty(quantity);
        ensureSufficientStock(item, removedQty);

        BigDecimal signedDelta = removedQty.negate();
        BigDecimal newQty = InventoryMath.toQty(item.getQuantity().subtract(removedQty));

        item.setQuantity(newQty);
        inventoryItemRepository.save(item);

        InventoryMovement movement = appendMovement(new MovementSpec(item, MovementType.CONSUMPTION,
                signedDelta, null, newQty, item.getCostPerUnit(), reason, execution, actorUserId));

        log.info("CONSUMPTION {} of {} units on item {} (execution {}, newQty={})",
                movement.getId(), removedQty, itemId,
                execution != null ? execution.getId() : null, newQty);
        return movement;
    }

    private record MovementSpec(
            InventoryItem item,
            MovementType type,
            BigDecimal quantityDelta,
            BigDecimal unitCost,
            BigDecimal quantityAfter,
            BigDecimal wacAfter,
            String reason,
            ServiceExecution execution,
            Long actorUserId) {}

    private InventoryMovement appendMovement(MovementSpec spec) {
        User actor = userRepository.findById(spec.actorUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ERR_USER_NOT_FOUND));

        InventoryMovement movement = InventoryMovement.builder()
                .item(spec.item())
                .movementType(spec.type())
                .quantityDelta(spec.quantityDelta())
                .unitCost(spec.unitCost())
                .quantityAfter(spec.quantityAfter())
                .wacAfter(spec.wacAfter())
                .reason(spec.reason())
                .execution(spec.execution())
                .actor(actor)
                .build();
        return inventoryMovementRepository.save(movement);
    }

    private InventoryItem lockItem(Long itemId, Long providerId) {
        InventoryItem item = inventoryItemRepository.findByIdAndProviderIdForUpdate(itemId, providerId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_ITEM_NOT_FOUND));
        if (item.getDeletedAt() != null) {
            throw new InvalidStateException(ERR_ITEM_DELETED);
        }
        return item;
    }

    private void ensureSufficientStock(InventoryItem item, BigDecimal removedQty) {
        if (item.getQuantity().compareTo(removedQty) < 0) {
            throw new InvalidStateException(ERR_NEGATIVE_STOCK);
        }
    }

    private ProviderProfile getProviderProfile(Long userId) {
        return providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ForbiddenException(ERR_PROVIDER_NOT_FOUND));
    }

    private String displayNameOf(User user) {
        Optional<String> clientName = clientProfileRepository.findByUserId(user.getId())
                .map(ClientProfile::getName);
        if (clientName.isPresent()) {
            return clientName.get();
        }
        return providerProfileRepository.findByUserId(user.getId())
                .map(ProviderProfile::getCompanyName)
                .orElse(user.getEmail());
    }
}
