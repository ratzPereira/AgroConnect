package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.Instant;

@Schema(description = "A single completed job the operator participated in.")
public record OperatorJobResponse(

        @Schema(description = "Execution ID") Long executionId,
        @Schema(description = "Service request ID (for client-side navigation)") Long requestId,
        @Schema(description = "Client name") String clientName,
        @Schema(description = "Hours worked by this operator on this job") BigDecimal hoursWorked,
        @Schema(description = "Hourly rate snapshotted at completion") BigDecimal hourlyRateSnapshot,
        @Schema(description = "Labor cost for this operator on this job = hours × rate") BigDecimal laborCost,
        @Schema(description = "Revenue attributed to this operator = proposal.price / operators on this exec") BigDecimal revenueAttributed,
        @Schema(description = "Machine used by this operator on this job (nullable)") String machineName,
        @Schema(description = "When the execution completed") Instant completedAt
) {}
