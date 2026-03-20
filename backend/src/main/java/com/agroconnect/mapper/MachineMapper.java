package com.agroconnect.mapper;

import com.agroconnect.dto.response.MachineResponse;
import com.agroconnect.model.Machine;

public final class MachineMapper {

    private MachineMapper() {}

    public static MachineResponse toResponse(Machine machine) {
        return new MachineResponse(
                machine.getId(),
                machine.getName(),
                machine.getType(),
                machine.getDescription(),
                machine.getStatus(),
                machine.getLicensePlate(),
                machine.getLastMaintenanceDate(),
                machine.getNextMaintenanceDate(),
                machine.getCreatedAt()
        );
    }
}
