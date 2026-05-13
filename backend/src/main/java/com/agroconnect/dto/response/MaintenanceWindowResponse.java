package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;

@Schema(description = "A planned maintenance window for a machine, surfaced as an overlay on the calendar.")
public record MaintenanceWindowResponse(

        @Schema(description = "Maintenance log ID") Long id,
        @Schema(description = "Machine ID") Long machineId,
        @Schema(description = "Machine name") String machineName,
        @Schema(description = "Date the maintenance was performed (or is planned for)") LocalDate performedAt,
        @Schema(description = "Date the next maintenance is due (nullable)") LocalDate nextDueAt,
        @Schema(description = "Short description of the work") String description
) {}
