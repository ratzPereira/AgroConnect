package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Schema(description = "Admin analytics for charts: distributions and time series")
public record AdminAnalyticsResponse(

        @Schema(description = "User count grouped by role") List<LabelCount> usersByRole,
        @Schema(description = "Service request count grouped by status") List<LabelCount> requestsByStatus,
        @Schema(description = "User registrations per day (last 14 days)") List<DayCount> registrationsDaily,
        @Schema(description = "Service requests created per day (last 14 days)") List<DayCount> requestsDaily,
        @Schema(description = "Transaction volume and commission per day (last 14 days)") List<DayRevenue> revenueDaily
) {

    @Schema(description = "A label with an associated count")
    public record LabelCount(
            @Schema(description = "Label (enum name)") String label,
            @Schema(description = "Count") long count
    ) {}

    @Schema(description = "A day with an associated count")
    public record DayCount(
            @Schema(description = "Day (ISO date)") LocalDate date,
            @Schema(description = "Count") long count
    ) {}

    @Schema(description = "A day with transaction volume and commission")
    public record DayRevenue(
            @Schema(description = "Day (ISO date)") LocalDate date,
            @Schema(description = "Transaction volume") BigDecimal amount,
            @Schema(description = "Platform commission") BigDecimal commission
    ) {}
}
