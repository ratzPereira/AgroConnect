package com.agroconnect.fixture;

import com.agroconnect.model.InventoryItem;
import com.agroconnect.model.enums.InventoryUnit;

import java.math.BigDecimal;
import java.time.Instant;

public final class InventoryFixture {

    private InventoryFixture() {}

    public static InventoryItem.InventoryItemBuilder anInventoryItem() {
        return InventoryItem.builder()
                .id(1L)
                .productName("Gasóleo agrícola")
                .unit(InventoryUnit.L)
                .quantity(500.0)
                .minStockAlert(50.0)
                .costPerUnit(new BigDecimal("1.45"))
                .createdAt(Instant.now())
                .updatedAt(Instant.now());
    }

    public static InventoryItem.InventoryItemBuilder aLowStockItem() {
        return InventoryItem.builder()
                .id(2L)
                .productName("Herbicida glifosato")
                .unit(InventoryUnit.L)
                .quantity(5.0)
                .minStockAlert(10.0)
                .costPerUnit(new BigDecimal("12.00"))
                .createdAt(Instant.now())
                .updatedAt(Instant.now());
    }
}
