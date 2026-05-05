package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;
import java.util.List;

@Schema(description = "Calendar event for provider schedule")
public record CalendarEventResponse(

        @Schema(description = "Execution ID") Long executionId,
        @Schema(description = "Request ID") Long requestId,
        @Schema(description = "Request title") String requestTitle,
        @Schema(description = "Service category name") String categoryName,
        @Schema(description = "Scheduled start date") LocalDate scheduledDate,
        @Schema(description = "Scheduled end date") LocalDate scheduledEndDate,
        @Schema(description = "Request status") String status,
        @Schema(description = "Island") String island,
        @Schema(description = "Parish") String parish,
        @Schema(description = "Urgency") String urgency,
        @Schema(description = "Assigned team members and machines") List<CalendarAssignment> assignments
) {
    @Schema(description = "Team member/machine assignment for calendar")
    public record CalendarAssignment(
            @Schema(description = "Team member ID") Long teamMemberId,
            @Schema(description = "Team member name") String teamMemberName,
            @Schema(description = "Machine ID") Long machineId,
            @Schema(description = "Machine name") String machineName
    ) {}
}
