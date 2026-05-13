package com.agroconnect.dto.response;

import com.agroconnect.model.enums.MovementType;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.Instant;

@Schema(description = "A single inventory movement in the ledger")
public record InventoryMovementResponse(

        @Schema(description = "Movement ID") Long id,
        @Schema(description = "Movement type") MovementType movementType,
        @Schema(description = "Signed quantity delta (+ for IN, − for OUT)") BigDecimal quantityDelta,
        @Schema(description = "Unit cost recorded for this movement (null for OUT)") BigDecimal unitCost,
        @Schema(description = "Stock quantity after this movement") BigDecimal quantityAfter,
        @Schema(description = "Weighted-average cost after this movement") BigDecimal wacAfter,
        @Schema(description = "Free-text reason / note") String reason,
        @Schema(description = "Linked service execution (when CONSUMPTION)") Long executionId,
        @Schema(description = "Actor user ID") Long actorUserId,
        @Schema(description = "Actor display name") String actorName,
        @Schema(description = "Movement timestamp") Instant createdAt
) {}
