package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

@Schema(description = "Provider dashboard overview")
public record ProviderDashboardResponse(

        @Schema(description = "Number of active jobs (AWARDED or IN_PROGRESS)") long activeJobs,
        @Schema(description = "Number of completed jobs") long completedJobs,
        @Schema(description = "Amount pending in escrow") BigDecimal pendingPayouts,
        @Schema(description = "Average provider rating") double avgRating,
        @Schema(description = "Total reviews received") int totalReviews,
        @Schema(description = "Number of low-stock inventory items") int lowStockItems,
        @Schema(description = "Number of machines with upcoming maintenance") int upcomingMaintenance
) {}
