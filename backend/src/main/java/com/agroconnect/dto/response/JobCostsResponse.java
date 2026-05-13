package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.util.List;

@Schema(description = "Job-costing summary for a single service execution")
public record JobCostsResponse(

        @Schema(description = "Execution ID") Long executionId,
        @Schema(description = "Whether the execution is locked from costing edits (completedAt != null)") boolean completed,

        @Schema(description = "Gross revenue = proposal.price") BigDecimal revenue,
        @Schema(description = "Total materials cost (sum of resource_usage.total_cost)") BigDecimal materialsCost,
        @Schema(description = "Total labor cost (sum of assignment.hoursWorked × effectiveRate)") BigDecimal laborCost,
        @Schema(description = "Platform commission = revenue × commissionRate") BigDecimal commission,
        @Schema(description = "Commission rate applied") BigDecimal commissionRate,
        @Schema(description = "Net profit = revenue − materials − labor − commission") BigDecimal netProfit,
        @Schema(description = "Margin percent = netProfit ÷ revenue × 100 (0 when revenue == 0)") BigDecimal marginPercent,

        @Schema(description = "Per-assignment labor breakdown") List<AssignmentCostResponse> assignments,
        @Schema(description = "Resource usages consumed") List<ExecutionResourceUsageResponse> resourceUsages,

        @Schema(description = "Number of assignments missing an hourly rate (labor cost incomplete)") int assignmentsMissingRate
) {}
