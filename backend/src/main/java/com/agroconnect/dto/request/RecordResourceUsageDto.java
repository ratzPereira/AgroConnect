package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@Schema(description = "Payload to record an inventory resource consumed by a service execution")
public record RecordResourceUsageDto(

        @Schema(description = "Inventory item ID to consume from", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull
        Long inventoryItemId,

        @Schema(description = "Quantity to consume (must be > 0)", example = "12.500",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull
        @DecimalMin(value = "0.001", message = "A quantidade deve ser superior a zero.")
        @Digits(integer = 11, fraction = 3)
        BigDecimal quantity,

        @Schema(description = "Optional note (e.g. lot identifier)")
        @Size(max = 255)
        String notes
) {}
