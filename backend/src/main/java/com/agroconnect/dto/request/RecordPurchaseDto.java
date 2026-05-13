package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@Schema(description = "Record a PURCHASE movement for an inventory item. Quantity is added and the weighted-average cost is recomputed.")
public record RecordPurchaseDto(

        @NotNull
        @Positive
        @Digits(integer = 11, fraction = 3)
        @Schema(description = "Quantity purchased (must be positive)", example = "200.000")
        BigDecimal quantity,

        @NotNull
        @DecimalMin("0.0")
        @Digits(integer = 6, fraction = 4)
        @Schema(description = "Unit cost paid for this batch in EUR (required)", example = "1.4500")
        BigDecimal unitCost,

        @Size(max = 255)
        @Schema(description = "Optional note explaining the purchase", example = "Fornecedor Repsol")
        String reason
) {}
