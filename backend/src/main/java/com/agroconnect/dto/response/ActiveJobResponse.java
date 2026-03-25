package com.agroconnect.dto.response;

import com.agroconnect.model.enums.RequestStatus;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Provider active job with next-action context")
public record ActiveJobResponse(
        @Schema(description = "Execution ID") Long executionId,
        @Schema(description = "Request ID") Long requestId,
        @Schema(description = "Request title") String requestTitle,
        @Schema(description = "Service category name") String categoryName,
        @Schema(description = "Island name") String island,
        @Schema(description = "Current request status") RequestStatus requestStatus,
        @Schema(description = "Whether team has been assigned") boolean hasAssignment,
        @Schema(description = "Whether check-in was done") boolean hasCheckin
) {}
