package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.util.List;

@Schema(description = "Aggregated client dashboard data")
public record ClientDashboardResponse(
        @Schema(description = "Active (non-terminal, non-draft) request count") int activeRequests,
        @Schema(description = "Total proposals received across active requests") long totalProposals,
        @Schema(description = "Completed + rated request count") int completedRequests,
        @Schema(description = "Total spent (released transactions)") BigDecimal totalSpent,
        @Schema(description = "Recent requests (max 10)") List<ServiceRequestSummaryResponse> recentRequests,
        @Schema(description = "Recent notifications (max 6)") List<NotificationResponse> recentNotifications
) {}
