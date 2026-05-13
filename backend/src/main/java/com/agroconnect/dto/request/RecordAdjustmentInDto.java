package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@Schema(description = "Record an ADJUSTMENT_IN movement (manual correction, gift, found stock). If unitCost is provided, the weighted-average cost is recomputed.")
public record RecordAdjustmentInDto(

        @NotNull
        @Positive
        @Digits(integer = 11, fraction = 3)
        @Schema(description = "Quantity added (must be positive)", example = "10.000")
        BigDecimal quantity,

        @DecimalMin("0.0")
        @Digits(integer = 6, fraction = 4)
        @Schema(description = "Unit cost of the added stock (optional). If null, current WAC is preserved.",
                example = "1.5000")
        BigDecimal unitCost,

        @NotBlank
        @Size(max = 255)
        @Schema(description = "Reason for the adjustment (required for audit)", example = "Stock encontrado em armazém")
        String reason
) {}
