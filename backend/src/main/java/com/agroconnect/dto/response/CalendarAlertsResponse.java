package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;
import java.util.List;

@Schema(description = "Operational alerts surfaced in the calendar side rail for the visible range.")
public record CalendarAlertsResponse(

        @Schema(description = "Resource conflicts (operator/machine double-booked)") List<ConflictAlert> conflicts,
        @Schema(description = "Maintenance due dates falling inside the visible range") List<MaintenanceAlert> maintenance,
        @Schema(description = "Payments awaiting client confirmation past the typical SLA") List<PaymentAlert> payments,
        @Schema(description = "New proposals on open requests awaiting provider action") List<ProposalAlert> proposals
) {
    @Schema(description = "A resource conflict in the visible range")
    public record ConflictAlert(
            @Schema(description = "Date of the conflict") LocalDate date,
            @Schema(description = "TEAM_MEMBER or MACHINE") String resourceType,
            @Schema(description = "Resource ID") Long resourceId,
            @Schema(description = "Display name") String resourceName,
            @Schema(description = "Number of overlapping executions on this resource") int overlappingCount
    ) {}

    @Schema(description = "A maintenance due date in the visible range")
    public record MaintenanceAlert(
            @Schema(description = "Maintenance log ID") Long maintenanceLogId,
            @Schema(description = "Machine ID") Long machineId,
            @Schema(description = "Machine name") String machineName,
            @Schema(description = "Due date") LocalDate dueDate,
            @Schema(description = "Short description") String description
    ) {}

    @Schema(description = "An execution awaiting client confirmation past the SLA")
    public record PaymentAlert(
            @Schema(description = "Execution ID") Long executionId,
            @Schema(description = "Request title") String requestTitle,
            @Schema(description = "Date the execution completed") LocalDate completedOn,
            @Schema(description = "Days waiting for client confirmation") int daysAwaiting
    ) {}

    @Schema(description = "A proposal awaiting client decision on an open request")
    public record ProposalAlert(
            @Schema(description = "Request ID") Long requestId,
            @Schema(description = "Request title") String requestTitle,
            @Schema(description = "Number of competing proposals on the request") int competingProposals,
            @Schema(description = "Date the proposal was submitted") LocalDate submittedOn
    ) {}
}
