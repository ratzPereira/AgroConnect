package com.agroconnect.dto.response;

import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.model.enums.Urgency;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Service request summary for list views")
public record ServiceRequestSummaryResponse(

        @Schema(description = "Request ID") Long id,
        @Schema(description = "Category name") String categoryName,
        @Schema(description = "Current status") RequestStatus status,
        @Schema(description = "Request title") String title,
        @Schema(description = "Parish") String parish,
        @Schema(description = "Municipality") String municipality,
        @Schema(description = "Island") String island,
        @Schema(description = "Area") Double area,
        @Schema(description = "Area unit") String areaUnit,
        @Schema(description = "Urgency level") Urgency urgency,
        @Schema(description = "Number of proposals") int proposalCount,
        @Schema(description = "Created at") Instant createdAt
) {}
