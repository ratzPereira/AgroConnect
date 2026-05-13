package com.agroconnect.mapper;

import com.agroconnect.dto.response.InventoryMovementResponse;
import com.agroconnect.model.InventoryMovement;

public final class InventoryMovementMapper {

    private InventoryMovementMapper() {}

    public static InventoryMovementResponse toResponse(InventoryMovement movement, String actorName) {
        return new InventoryMovementResponse(
                movement.getId(),
                movement.getMovementType(),
                movement.getQuantityDelta(),
                movement.getUnitCost(),
                movement.getQuantityAfter(),
                movement.getWacAfter(),
                movement.getReason(),
                movement.getExecution() != null ? movement.getExecution().getId() : null,
                movement.getActor().getId(),
                actorName,
                movement.getCreatedAt()
        );
    }
}
