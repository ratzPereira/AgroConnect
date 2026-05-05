package com.agroconnect.dto.response;

import com.agroconnect.model.enums.MachineStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.time.LocalDate;

@Schema(description = "Machine details")
public record MachineResponse(

        @Schema(description = "Machine ID") Long id,
        @Schema(description = "Machine name") String name,
        @Schema(description = "Machine type") String type,
        @Schema(description = "Description") String description,
        @Schema(description = "Current status") MachineStatus status,
        @Schema(description = "License plate") String licensePlate,
        @Schema(description = "Last maintenance date") LocalDate lastMaintenanceDate,
        @Schema(description = "Next maintenance date") LocalDate nextMaintenanceDate,
        @Schema(description = "Created at") Instant createdAt
) {}
