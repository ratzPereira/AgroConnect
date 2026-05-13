package com.agroconnect.mapper;

import com.agroconnect.dto.response.ExecutionResourceUsageResponse;
import com.agroconnect.model.ExecutionResourceUsage;

public final class JobCostingMapper {

    private JobCostingMapper() {}

    public static ExecutionResourceUsageResponse toResponse(ExecutionResourceUsage usage, String recordedByName) {
        return new ExecutionResourceUsageResponse(
                usage.getId(),
                usage.getInventoryItem().getId(),
                usage.getInventoryItem().getProductName(),
                usage.getInventoryItem().getUnit().name(),
                usage.getQuantity(),
                usage.getUnitCostSnapshot(),
                usage.getTotalCost(),
                usage.getNotes(),
                usage.getInventoryMovement().getId(),
                usage.getRecordedBy().getId(),
                recordedByName,
                usage.getCreatedAt()
        );
    }
}
