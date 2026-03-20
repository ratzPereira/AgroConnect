package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Assign team member and optional machine to execution")
public record AssignExecutionDto(

        @NotNull
        @Schema(description = "Team member ID to assign")
        Long teamMemberId,

        @Schema(description = "Machine ID to assign (optional)")
        Long machineId
) {}
