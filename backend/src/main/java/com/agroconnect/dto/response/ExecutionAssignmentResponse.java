package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Execution assignment details")
public record ExecutionAssignmentResponse(

        @Schema(description = "Assignment ID") Long id,
        @Schema(description = "Team member ID") Long teamMemberId,
        @Schema(description = "Team member name") String teamMemberName,
        @Schema(description = "Team member role") String teamMemberRole,
        @Schema(description = "Machine ID") Long machineId,
        @Schema(description = "Machine name") String machineName,
        @Schema(description = "Assigned at") Instant assignedAt
) {}
