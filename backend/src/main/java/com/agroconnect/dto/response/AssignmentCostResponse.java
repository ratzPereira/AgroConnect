package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

@Schema(description = "Cost contribution of one execution assignment")
public record AssignmentCostResponse(

        @Schema(description = "Assignment ID") Long assignmentId,
        @Schema(description = "Team member ID") Long teamMemberId,
        @Schema(description = "Team member name") String teamMemberName,
        @Schema(description = "Hours worked by the operator") BigDecimal hoursWorked,
        @Schema(description = "Machine usage hours") BigDecimal machineHours,
        @Schema(description = "Effective hourly rate used to compute laborCost "
                + "(snapshot if completed, else member's current rate)") BigDecimal effectiveHourlyRate,
        @Schema(description = "Labor cost = hoursWorked × effectiveHourlyRate") BigDecimal laborCost
) {}
