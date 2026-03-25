package com.agroconnect.dto.response;

import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.model.enums.Urgency;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Lightweight request data for map pins")
public record RequestPinResponse(
        @Schema(description = "Request ID") Long id,
        @Schema(description = "Latitude") double latitude,
        @Schema(description = "Longitude") double longitude,
        @Schema(description = "Current status") RequestStatus status,
        @Schema(description = "Request title") String title,
        @Schema(description = "Service category name") String categoryName,
        @Schema(description = "Urgency level") Urgency urgency,
        @Schema(description = "Island name") String island
) {}
