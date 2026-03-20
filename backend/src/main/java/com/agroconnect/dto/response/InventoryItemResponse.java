package com.agroconnect.dto.response;

import com.agroconnect.model.enums.InventoryUnit;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.Instant;

@Schema(description = "Inventory item details")
public record InventoryItemResponse(

        @Schema(description = "Item ID") Long id,
        @Schema(description = "Product name") String productName,
        @Schema(description = "Unit of measurement") InventoryUnit unit,
        @Schema(description = "Current quantity") double quantity,
        @Schema(description = "Minimum stock alert threshold") Double minStockAlert,
        @Schema(description = "Cost per unit in EUR") BigDecimal costPerUnit,
        @Schema(description = "Whether the item is below the stock alert threshold") boolean lowStock,
        @Schema(description = "Created at") Instant createdAt,
        @Schema(description = "Updated at") Instant updatedAt
) {}
