package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

@Schema(description = "Calendar event for provider schedule")
public record CalendarEventResponse(

        @Schema(description = "Execution ID") Long executionId,
        @Schema(description = "Request ID") Long requestId,
        @Schema(description = "Request title") String requestTitle,
        @Schema(description = "Service category name") String categoryName,
        @Schema(description = "Event date") Instant date,
        @Schema(description = "Request status") String status,
        @Schema(description = "Assigned team member names") List<String> teamMembers
) {}
