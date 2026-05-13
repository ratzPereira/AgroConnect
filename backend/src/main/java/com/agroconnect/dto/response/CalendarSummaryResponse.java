package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

@Schema(description = "Aggregate KPIs for the calendar visible range (Day / Week / Month).")
public record CalendarSummaryResponse(

        @Schema(description = "Total executions scheduled in the visible window") long totalEvents,
        @Schema(description = "Executions in IN_PROGRESS state") long inProgress,
        @Schema(description = "Executions in AWAITING_CONFIRMATION state") long awaitingConfirmation,
        @Schema(description = "Executions completed in the visible window") long completed,
        @Schema(description = "Executions with detected resource conflicts") long conflicting,
        @Schema(description = "Sum of accepted proposal prices for events in the window (EUR)") BigDecimal totalRevenue,
        @Schema(description = "Distinct operators with at least one assignment in the window") long activeOperators,
        @Schema(description = "Distinct machines with at least one assignment in the window") long activeMachines,
        @Schema(description = "Average utilization across operators in the window (0..1)") BigDecimal operatorUtilization
) {}
