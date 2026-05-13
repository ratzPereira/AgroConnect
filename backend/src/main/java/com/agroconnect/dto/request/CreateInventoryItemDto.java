package com.agroconnect.dto.request;

import com.agroconnect.model.enums.InventoryUnit;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
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
        @Digits(integer = 11, fraction = 3)
        @Schema(description = "Initial quantity", example = "500.000")
        BigDecimal quantity,

        @PositiveOrZero
        @Digits(integer = 11, fraction = 3)
        @Schema(description = "Minimum stock alert threshold", example = "50.000")
        BigDecimal minStockAlert,

        @DecimalMin("0.0")
        @Digits(integer = 6, fraction = 4)
        @Schema(description = "Cost per unit in EUR (optional; sets the initial weighted-average cost)",
                example = "1.4500")
        BigDecimal costPerUnit
) {}
