package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

@Schema(description = "Provider financial summary. Defaults to the current year when no year is requested.")
public record FinanceSummaryResponse(

        @Schema(description = "Lifetime total revenue (gross, all years)") BigDecimal totalRevenue,
        @Schema(description = "Lifetime total platform commissions") BigDecimal totalCommissions,
        @Schema(description = "Lifetime total net earnings") BigDecimal totalEarnings,
        @Schema(description = "Amount currently in escrow (lifetime)") BigDecimal pendingPayouts,
        @Schema(description = "Earnings this month") BigDecimal thisMonthEarnings,
        @Schema(description = "Number of completed (released) jobs (lifetime)") long completedJobs,
        @Schema(description = "Average gross job value (lifetime)") BigDecimal avgJobValue,

        @Schema(description = "Year used for annual aggregates") int year,
        @Schema(description = "Gross revenue released in the year") BigDecimal yearRevenue,
        @Schema(description = "Commissions released in the year") BigDecimal yearCommissions,
        @Schema(description = "Net payouts released in the year") BigDecimal yearPayouts,
        @Schema(description = "Materials cost in the year (snapshot at completion)") BigDecimal yearMaterialsCost,
        @Schema(description = "Labor cost in the year (hours × snapshot rate)") BigDecimal yearLaborCost,
        @Schema(description = "Machine maintenance + expenses in the year") BigDecimal yearMachineExpenses,
        @Schema(description = "Real net profit in the year (payouts − materials − labor − machineExpenses)")
        BigDecimal yearNetProfit,
        @Schema(description = "Net margin in the year as percentage (0–100)") BigDecimal yearMargin,
        @Schema(description = "Completed jobs in the year") long yearCompletedJobs,
        @Schema(description = "Average gross job value in the year") BigDecimal yearAvgJobValue,
        @Schema(description = "Average net profit per job in the year") BigDecimal yearAvgJobProfit
) {}
