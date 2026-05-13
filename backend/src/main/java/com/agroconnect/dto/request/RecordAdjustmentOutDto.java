package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@Schema(description = "Record an ADJUSTMENT_OUT movement (spoilage, theft, write-off). Quantity is removed; the weighted-average cost is preserved.")
public record RecordAdjustmentOutDto(

        @NotNull
        @Positive
        @Digits(integer = 11, fraction = 3)
        @Schema(description = "Quantity removed (must be positive)", example = "5.000")
        BigDecimal quantity,

        @NotBlank
        @Size(max = 255)
        @Schema(description = "Reason for the removal (required for audit)", example = "Estragado")
        String reason
) {}
