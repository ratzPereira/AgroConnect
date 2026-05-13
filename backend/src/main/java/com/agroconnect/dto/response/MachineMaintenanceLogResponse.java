package com.agroconnect.dto.response;

import com.agroconnect.model.enums.MaintenanceType;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Schema(description = "A single maintenance log entry for a machine.")
public record MachineMaintenanceLogResponse(

        @Schema(description = "Log entry ID") Long id,
        @Schema(description = "Machine ID") Long machineId,
        @Schema(description = "Type of maintenance") MaintenanceType maintenanceType,
        @Schema(description = "Description of the work performed") String description,
        @Schema(description = "Cost in EUR (nullable)") BigDecimal cost,
        @Schema(description = "Workshop or technician name (nullable)") String workshopName,
        @Schema(description = "Date the work was performed") LocalDate performedAt,
        @Schema(description = "Date next maintenance is due (nullable)") LocalDate nextDueAt,
        @Schema(description = "Free-text notes (nullable)") String notes,
        @Schema(description = "ID of the user who recorded the entry") Long createdById,
        @Schema(description = "Display name of the user who recorded the entry") String createdByName,
        @Schema(description = "When the entry was recorded") Instant createdAt
) {}
