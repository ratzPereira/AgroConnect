package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Schema(description = "Service execution details")
public record ServiceExecutionResponse(

        @Schema(description = "Execution ID") Long id,
        @Schema(description = "Proposal ID") Long proposalId,
        @Schema(description = "Request ID") Long requestId,
        @Schema(description = "Scheduled start date") LocalDate scheduledDate,
        @Schema(description = "Scheduled end date") LocalDate scheduledEndDate,
        @Schema(description = "Check-in latitude") Double checkinLatitude,
        @Schema(description = "Check-in longitude") Double checkinLongitude,
        @Schema(description = "Check-in time") Instant checkinTime,
        @Schema(description = "Checkout time") Instant checkoutTime,
        @Schema(description = "Notes") String notes,
        @Schema(description = "Materials used (JSON)") String materialsUsed,
        @Schema(description = "Completed at") Instant completedAt,
        @Schema(description = "Created at") Instant createdAt,
        @Schema(description = "Assigned team members and machines") List<ExecutionAssignmentResponse> assignments,
        @Schema(description = "Execution photos") List<ExecutionPhotoResponse> photos
) {}
