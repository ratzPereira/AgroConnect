package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Update metadata on an inventory item. Quantity and cost are NOT mutable
 * here — they are derived from the movement ledger. Use the movement
 * endpoints (purchase / adjustment-in / adjustment-out) to change stock.
 */
@Schema(description = "Update inventory item metadata (name, alert threshold)")
public record UpdateInventoryItemDto(

        @Size(max = 255)
        @Schema(description = "Product name (optional rename)", example = "Gasóleo agrícola")
        String productName,

        @PositiveOrZero
        @Digits(integer = 11, fraction = 3)
        @Schema(description = "Minimum stock alert threshold (null clears the alert)", example = "50.000")
        BigDecimal minStockAlert
) {}
