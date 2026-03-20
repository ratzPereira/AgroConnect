package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

@Schema(description = "Admin platform dashboard metrics")
public record AdminDashboardResponse(

        @Schema(description = "Total registered users") long totalUsers,
        @Schema(description = "Total clients") long totalClients,
        @Schema(description = "Total providers") long totalProviders,
        @Schema(description = "Total service requests") long totalRequests,
        @Schema(description = "Active requests (non-terminal)") long activeRequests,
        @Schema(description = "Total transaction volume") BigDecimal totalVolume,
        @Schema(description = "Total platform commissions") BigDecimal totalCommissions,
        @Schema(description = "Number of pending disputes") long pendingDisputes,
        @Schema(description = "Average platform rating") double avgPlatformRating
) {}
