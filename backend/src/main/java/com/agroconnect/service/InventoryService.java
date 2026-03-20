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

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryService {

    private static final Logger log = LoggerFactory.getLogger(InventoryService.class);

    private final InventoryItemRepository inventoryItemRepository;
    private final ProviderProfileRepository providerProfileRepository;

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
                .orElseThrow(() -> new ResourceNotFoundException("Item de inventário não encontrado."));
        return InventoryMapper.toResponse(item);
    }

    @Transactional
    public InventoryItemResponse create(CreateInventoryItemDto dto, Long userId) {
        ProviderProfile provider = getProviderProfile(userId);

        if (inventoryItemRepository.existsByProviderIdAndProductName(provider.getId(), dto.productName())) {
            throw new InvalidStateException("Já existe um item com este nome de produto.");
        }

        InventoryItem item = InventoryItem.builder()
                .provider(provider)
                .productName(dto.productName())
                .unit(dto.unit())
                .quantity(dto.quantity())
                .minStockAlert(dto.minStockAlert())
                .costPerUnit(dto.costPerUnit())
                .build();

        item = inventoryItemRepository.save(item);
        log.info("Inventory item {} created for provider {}", item.getId(), provider.getId());
        return InventoryMapper.toResponse(item);
    }

    @Transactional
    public InventoryItemResponse update(Long id, UpdateInventoryItemDto dto, Long userId) {
        ProviderProfile provider = getProviderProfile(userId);
        InventoryItem item = inventoryItemRepository.findByIdAndProviderId(id, provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Item de inventário não encontrado."));

        item.setQuantity(dto.quantity());
        item.setMinStockAlert(dto.minStockAlert());
        item.setCostPerUnit(dto.costPerUnit());

        item = inventoryItemRepository.save(item);
        log.info("Inventory item {} updated", item.getId());
        return InventoryMapper.toResponse(item);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        ProviderProfile provider = getProviderProfile(userId);
        InventoryItem item = inventoryItemRepository.findByIdAndProviderId(id, provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Item de inventário não encontrado."));

        inventoryItemRepository.delete(item);
        log.info("Inventory item {} deleted", id);
    }

    private ProviderProfile getProviderProfile(Long userId) {
        return providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ForbiddenException("Perfil de prestador não encontrado."));
    }
}
