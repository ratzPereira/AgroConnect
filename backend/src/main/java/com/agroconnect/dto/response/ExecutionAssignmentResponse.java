package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.Instant;

@Schema(description = "Execution assignment details")
public record ExecutionAssignmentResponse(

        @Schema(description = "Assignment ID") Long id,
        @Schema(description = "Team member ID") Long teamMemberId,
        @Schema(description = "Team member name") String teamMemberName,
        @Schema(description = "Team member role") String teamMemberRole,
        @Schema(description = "Machine ID") Long machineId,
        @Schema(description = "Machine name") String machineName,
        @Schema(description = "Assigned at") Instant assignedAt,
        @Schema(description = "Hours worked by the operator (job costing)") BigDecimal hoursWorked,
        @Schema(description = "Machine usage hours (job costing)") BigDecimal machineHours,
        @Schema(description = "Hourly rate locked at completion (null while editable)") BigDecimal hourlyRateSnapshot
) {}
