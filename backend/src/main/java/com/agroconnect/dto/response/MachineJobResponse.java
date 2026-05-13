package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.Instant;

@Schema(description = "A single completed job involving a machine — listed in the machine's history.")
public record MachineJobResponse(

        @Schema(description = "Execution ID") Long executionId,
        @Schema(description = "Service request ID (for client-side navigation)") Long requestId,
        @Schema(description = "Client name") String clientName,
        @Schema(description = "Proposal price = revenue for this job") BigDecimal revenue,
        @Schema(description = "Machine hours logged on this job") BigDecimal machineHours,
        @Schema(description = "When the execution completed") Instant completedAt
) {}
