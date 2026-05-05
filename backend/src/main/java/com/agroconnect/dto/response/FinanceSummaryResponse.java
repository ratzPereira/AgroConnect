package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

@Schema(description = "Provider financial summary")
public record FinanceSummaryResponse(

        @Schema(description = "Total revenue (gross)") BigDecimal totalRevenue,
        @Schema(description = "Total platform commissions") BigDecimal totalCommissions,
        @Schema(description = "Total net earnings") BigDecimal totalEarnings,
        @Schema(description = "Amount currently in escrow") BigDecimal pendingPayouts,
        @Schema(description = "Earnings this month") BigDecimal thisMonthEarnings,
        @Schema(description = "Number of completed (released) jobs") long completedJobs,
        @Schema(description = "Average job value") BigDecimal avgJobValue
) {}
