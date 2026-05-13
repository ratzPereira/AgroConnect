package com.agroconnect.service;

import com.agroconnect.dto.request.CreateInventoryItemDto;
import com.agroconnect.dto.request.UpdateInventoryItemDto;
import com.agroconnect.dto.response.InventoryItemResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.mapper.InventoryMapper;
import com.agroconnect.model.InventoryItem;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.repository.InventoryItemRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Item-level CRUD and read API for inventory. Stock changes flow through
 * {@link InventoryMovementService}; this class only owns the item's own
 * lifecycle (create / rename / alert threshold / soft-delete).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryService {

    private static final Logger log = LoggerFactory.getLogger(InventoryService.class);

    private static final String ERR_INVENTORY_NOT_FOUND = "Item de inventário não encontrado.";
    private static final String ERR_DUPLICATE_NAME = "Já existe um item com este nome de produto.";
    private static final String ERR_DELETE_WITH_STOCK =
            "Não é possível eliminar um item com stock positivo. Esvazie o stock primeiro (ajuste para fora ou consumo).";

    private final InventoryItemRepository inventoryItemRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final InventoryMovementService inventoryMovementService;

    public List<InventoryItemResponse> listByProvider(Long userId) {
        ProviderProfile provider = getProviderProfile(userId);
        return inventoryItemRepository.findByProviderId(provider.getId()).stream()
                .map(InventoryMapper::toResponse)
                .toList();
    }

    public List<InventoryItemResponse> getLowStockItems(Long userId) {
        ProviderProfile provider = getProviderProfile(userId);
        return inventoryItemRepository.findLowStockByProviderId(provider.getId()).stream()
                .map(InventoryMapper::toResponse)
                .toList();
    }

    public InventoryItemResponse getById(Long id, Long userId) {
        ProviderProfile provider = getProviderProfile(userId);
        InventoryItem item = inventoryItemRepository.findByIdAndProviderId(id, provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException(ERR_INVENTORY_NOT_FOUND));
        return InventoryMapper.toResponse(item);
    }

    @Transactional
    public InventoryItemResponse create(CreateInventoryItemDto dto, Long userId) {
        ProviderProfile provider = getProviderProfile(userId);

        if (inventoryItemRepository.existsByProviderIdAndProductName(provider.getId(), dto.productName())) {
            throw new InvalidStateException(ERR_DUPLICATE_NAME);
        }

        BigDecimal initialQty = InventoryMath.toQty(dto.quantity());
        BigDecimal initialCost = InventoryMath.toCost(
                dto.costPerUnit() != null ? dto.costPerUnit() : BigDecimal.ZERO);

        InventoryItem item = InventoryItem.builder()
                .provider(provider)
                .productName(dto.productName())
                .unit(dto.unit())
                .quantity(BigDecimal.ZERO)
                .minStockAlert(dto.minStockAlert())
                .costPerUnit(BigDecimal.ZERO)
                .build();
        item = inventoryItemRepository.save(item);

        if (initialQty.signum() > 0) {
            inventoryMovementService.recordInitial(item, initialQty, initialCost, userId);
        }

        log.info("Inventory item {} created for provider {} (qty={}, cost={})",
                item.getId(), provider.getId(), initialQty, initialCost);
        return InventoryMapper.toResponse(item);
    }

    @Transactional
    public InventoryItemResponse update(Long id, UpdateInventoryItemDto dto, Long userId) {
        ProviderProfile provider = getProviderProfile(userId);
        InventoryItem item = inventoryItemRepository.findByIdAndProviderId(id, provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException(ERR_INVENTORY_NOT_FOUND));

        if (dto.productName() != null && !dto.productName().equals(item.getProductName())) {
            if (inventoryItemRepository.existsByProviderIdAndProductName(provider.getId(), dto.productName())) {
                throw new InvalidStateException(ERR_DUPLICATE_NAME);
            }
            item.setProductName(dto.productName());
        }

        item.setMinStockAlert(dto.minStockAlert());

        item = inventoryItemRepository.save(item);
        log.info("Inventory item {} metadata updated", item.getId());
        return InventoryMapper.toResponse(item);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        ProviderProfile provider = getProviderProfile(userId);
        InventoryItem item = inventoryItemRepository.findByIdAndProviderId(id, provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException(ERR_INVENTORY_NOT_FOUND));

        if (item.getQuantity() != null && item.getQuantity().signum() > 0) {
            throw new InvalidStateException(ERR_DELETE_WITH_STOCK);
        }

        item.setDeletedAt(Instant.now());
        inventoryItemRepository.save(item);
        log.info("Inventory item {} soft-deleted by user {}", id, userId);
    }

    private ProviderProfile getProviderProfile(Long userId) {
        return providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ForbiddenException("Perfil de prestador não encontrado."));
    }
}
