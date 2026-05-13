package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDate;

@Schema(description = "Aggregated operating analytics for a machine over a period [from, to].")
public record MachineAnalyticsResponse(

        @Schema(description = "Machine ID") Long machineId,
        @Schema(description = "Machine name (denormalized for convenience)") String machineName,

        @Schema(description = "Inclusive start of the period") LocalDate from,
        @Schema(description = "Inclusive end of the period") LocalDate to,

        @Schema(description = "Number of completed jobs the machine appeared on") long jobsDone,
        @Schema(description = "Sum of machine_hours across those jobs") BigDecimal machineHours,
        @Schema(description = "Approximate utilization %: machineHours / (days × 8). 0 if period is degenerate.") BigDecimal utilizationPercent,

        @Schema(description = "Revenue attributed to this machine (full proposal.price per execution it appears on)") BigDecimal revenue,
        @Schema(description = "Total maintenance cost in the period") BigDecimal maintenanceCost,
        @Schema(description = "Total operating expenses in the period") BigDecimal expensesCost,
        @Schema(description = "Net contribution = revenue − maintenance − expenses") BigDecimal netContribution,

        @Schema(description = "Number of maintenance entries in the period") long maintenanceCount,

        @Schema(description = "Date of the most recent maintenance (nullable)") LocalDate lastMaintenanceAt,
        @Schema(description = "Date of the next scheduled maintenance (nullable)") LocalDate nextMaintenanceAt
) {}
