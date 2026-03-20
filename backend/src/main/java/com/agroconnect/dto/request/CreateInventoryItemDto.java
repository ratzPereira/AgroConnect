package com.agroconnect.dto.request;

import com.agroconnect.model.enums.InventoryUnit;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@Schema(description = "Create a new inventory item")
public record CreateInventoryItemDto(

        @NotBlank
        @Size(max = 255)
        @Schema(description = "Product name", example = "Gasóleo agrícola")
        String productName,

        @NotNull
        @Schema(description = "Unit of measurement")
        InventoryUnit unit,

        @NotNull
        @PositiveOrZero
        @Schema(description = "Current quantity", example = "500.0")
        Double quantity,

        @Schema(description = "Minimum stock alert threshold", example = "50.0")
        Double minStockAlert,

        @Schema(description = "Cost per unit in EUR", example = "1.45")
        BigDecimal costPerUnit
) {}
