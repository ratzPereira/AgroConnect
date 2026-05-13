package com.agroconnect.mapper;

import com.agroconnect.dto.response.InventoryItemResponse;
import com.agroconnect.model.InventoryItem;

public final class InventoryMapper {

    private InventoryMapper() {}

    public static InventoryItemResponse toResponse(InventoryItem item) {
        boolean lowStock = item.getMinStockAlert() != null
                && item.getQuantity().compareTo(item.getMinStockAlert()) <= 0;

        return new InventoryItemResponse(
                item.getId(),
                item.getProductName(),
                item.getUnit(),
                item.getQuantity(),
                item.getMinStockAlert(),
                item.getCostPerUnit(),
                lowStock,
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}
