package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Reassign an execution from one team member to another, optionally swapping the machine.")
public record ReassignExecutionDto(

        @NotNull
        @Schema(description = "Team member currently assigned (the row being replaced)")
        Long fromTeamMemberId,

        @NotNull
        @Schema(description = "Team member to assign in place of the original")
        Long toTeamMemberId,

        @Schema(description = "Machine to assign on the new row (optional; null keeps the previous machine)")
        Long machineId
) {}
