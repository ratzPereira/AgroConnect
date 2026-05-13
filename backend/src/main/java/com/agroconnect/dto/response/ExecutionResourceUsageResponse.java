package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.Instant;

@Schema(description = "Resource consumed by a service execution")
public record ExecutionResourceUsageResponse(

        @Schema(description = "Usage ID") Long id,
        @Schema(description = "Inventory item ID") Long inventoryItemId,
        @Schema(description = "Inventory item product name") String productName,
        @Schema(description = "Inventory unit (KG, L, UNIT, M, M2, M3, HORA)") String unit,
        @Schema(description = "Quantity consumed") BigDecimal quantity,
        @Schema(description = "Unit cost at the moment of consumption (snapshot of WAC)") BigDecimal unitCostSnapshot,
        @Schema(description = "Total cost (quantity × unitCostSnapshot)") BigDecimal totalCost,
        @Schema(description = "Optional note") String notes,
        @Schema(description = "Linked inventory movement ID (CONSUMPTION)") Long inventoryMovementId,
        @Schema(description = "ID of the user who recorded the usage") Long recordedById,
        @Schema(description = "Display name of the user who recorded the usage") String recordedByName,
        @Schema(description = "Created at") Instant createdAt
) {}
