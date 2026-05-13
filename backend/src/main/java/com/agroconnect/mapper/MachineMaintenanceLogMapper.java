package com.agroconnect.mapper;

import com.agroconnect.dto.response.MachineMaintenanceLogResponse;
import com.agroconnect.model.MachineMaintenanceLog;

public final class MachineMaintenanceLogMapper {

    private MachineMaintenanceLogMapper() {}

    public static MachineMaintenanceLogResponse toResponse(MachineMaintenanceLog log, String createdByName) {
        return new MachineMaintenanceLogResponse(
                log.getId(),
                log.getMachine().getId(),
                log.getMaintenanceType(),
                log.getDescription(),
                log.getCost(),
                log.getWorkshopName(),
                log.getPerformedAt(),
                log.getNextDueAt(),
                log.getNotes(),
                log.getCreatedBy().getId(),
                createdByName,
                log.getCreatedAt()
        );
    }
}
