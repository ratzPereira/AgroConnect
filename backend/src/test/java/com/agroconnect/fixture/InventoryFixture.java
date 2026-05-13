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
                .quantity(new BigDecimal("500.000"))
                .minStockAlert(new BigDecimal("50.000"))
                .costPerUnit(new BigDecimal("1.4500"))
                .createdAt(Instant.now())
                .updatedAt(Instant.now());
    }

    public static InventoryItem.InventoryItemBuilder aLowStockItem() {
        return InventoryItem.builder()
                .id(2L)
                .productName("Herbicida glifosato")
                .unit(InventoryUnit.L)
                .quantity(new BigDecimal("5.000"))
                .minStockAlert(new BigDecimal("10.000"))
                .costPerUnit(new BigDecimal("12.0000"))
                .createdAt(Instant.now())
                .updatedAt(Instant.now());
    }
}
