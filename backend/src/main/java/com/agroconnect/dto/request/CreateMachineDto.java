package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@Schema(description = "Create a new machine")
public record CreateMachineDto(

        @NotBlank
        @Size(max = 255)
        @Schema(description = "Machine name", example = "Trator John Deere 6120M")
        String name,

        @Size(max = 100)
        @Schema(description = "Machine type", example = "Trator")
        String type,

        @Size(max = 500)
        @Schema(description = "Description of the machine")
        String description,

        @Size(max = 20)
        @Schema(description = "License plate", example = "AA-00-AA")
        String licensePlate,

        @Schema(description = "Next scheduled maintenance date")
        LocalDate nextMaintenanceDate
) {}
