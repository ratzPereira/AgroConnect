package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

@Schema(description = "Update an inventory item (quantity, alert threshold, cost)")
public record UpdateInventoryItemDto(

        @NotNull
        @PositiveOrZero
        @Schema(description = "New quantity", example = "300.0")
        Double quantity,

        @Schema(description = "Minimum stock alert threshold", example = "50.0")
        Double minStockAlert,

        @Schema(description = "Cost per unit in EUR", example = "1.50")
        BigDecimal costPerUnit
) {}
