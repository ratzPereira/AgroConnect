package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

@Schema(description = "Current year versus previous year side-by-side comparison.")
public record YearlyComparisonResponse(
        @Schema(description = "Current year") int currentYear,
        @Schema(description = "Previous year") int previousYear,

        @Schema(description = "Revenue current year") BigDecimal currentRevenue,
        @Schema(description = "Revenue previous year") BigDecimal previousRevenue,
        @Schema(description = "Revenue delta as percentage; null when previous year is zero") BigDecimal revenueDeltaPct,

        @Schema(description = "Net profit current year") BigDecimal currentProfit,
        @Schema(description = "Net profit previous year") BigDecimal previousProfit,
        @Schema(description = "Profit delta as percentage; null when previous year profit is zero") BigDecimal profitDeltaPct,

        @Schema(description = "Completed jobs current year") long currentJobs,
        @Schema(description = "Completed jobs previous year") long previousJobs
) {}
