package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

@Schema(description = "Single month aggregation row used in the finance monthly chart.")
public record MonthlyBreakdownEntry(
        @Schema(description = "Month index 1–12") int month,
        @Schema(description = "Gross revenue released this month") BigDecimal revenue,
        @Schema(description = "Provider payouts released this month") BigDecimal payouts,
        @Schema(description = "Materials cost (executions completed this month)") BigDecimal materialsCost,
        @Schema(description = "Labor cost (executions completed this month)") BigDecimal laborCost,
        @Schema(description = "Machine maintenance + expenses incurred this month") BigDecimal machineExpenses,
        @Schema(description = "Net profit this month (payouts − materials − labor − machineExpenses)") BigDecimal netProfit,
        @Schema(description = "Completed jobs released this month") long completedJobs
) {}
