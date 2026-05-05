package com.agroconnect.dto.request;

import com.agroconnect.model.enums.MachineStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@Schema(description = "Update an existing machine")
public record UpdateMachineDto(

        @NotBlank
        @Size(max = 255)
        @Schema(description = "Machine name")
        String name,

        @Size(max = 100)
        @Schema(description = "Machine type")
        String type,

        @Size(max = 500)
        @Schema(description = "Description")
        String description,

        @Schema(description = "Current status")
        MachineStatus status,

        @Size(max = 20)
        @Schema(description = "License plate")
        String licensePlate,

        @Schema(description = "Last maintenance date")
        LocalDate lastMaintenanceDate,

        @Schema(description = "Next scheduled maintenance date")
        LocalDate nextMaintenanceDate
) {}
