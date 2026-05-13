package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Schema(description = "Per-operator workload heatmap for a date range — one row per operator, one cell per day.")
public record WorkloadHeatmapResponse(

        @Schema(description = "Start date of the range (inclusive)") LocalDate from,
        @Schema(description = "End date of the range (inclusive)") LocalDate to,
        @Schema(description = "Workload rows, one per operator") List<OperatorWorkload> operators
) {
    @Schema(description = "Workload row for a single operator across the range")
    public record OperatorWorkload(
            @Schema(description = "Team member ID") Long teamMemberId,
            @Schema(description = "Display name") String teamMemberName,
            @Schema(description = "Role within the team") String role,
            @Schema(description = "Map of date → scheduled minutes that day (0 when nothing scheduled)")
            Map<LocalDate, Integer> minutesByDate,
            @Schema(description = "Total scheduled minutes across the range") int totalMinutes
    ) {}
}
