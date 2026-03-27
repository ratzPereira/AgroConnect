package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;
import java.util.List;

@Schema(description = "Scheduling conflict for a resource on a given date")
public record ConflictResponse(

        @Schema(description = "Date of the conflict") LocalDate date,
        @Schema(description = "Resource type: TEAM_MEMBER or MACHINE") String resourceType,
        @Schema(description = "Resource ID") Long resourceId,
        @Schema(description = "Resource name") String resourceName,
        @Schema(description = "Conflicting events") List<ConflictingEvent> conflictingEvents
) {
    @Schema(description = "An event involved in a conflict")
    public record ConflictingEvent(
            @Schema(description = "Execution ID") Long executionId,
            @Schema(description = "Request title") String requestTitle
    ) {}
}
