package com.agroconnect.dto.response;

import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.model.enums.Urgency;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Schema(description = "Full service request details")
public record ServiceRequestResponse(

        @Schema(description = "Request ID") Long id,
        @Schema(description = "Client ID") Long clientId,
        @Schema(description = "Client name") String clientName,
        @Schema(description = "Category ID") Long categoryId,
        @Schema(description = "Category name") String categoryName,
        @Schema(description = "Current status") RequestStatus status,
        @Schema(description = "Request title") String title,
        @Schema(description = "Request description") String description,
        @Schema(description = "Latitude") Double latitude,
        @Schema(description = "Longitude") Double longitude,
        @Schema(description = "Parish") String parish,
        @Schema(description = "Municipality") String municipality,
        @Schema(description = "Island") String island,
        @Schema(description = "Area") Double area,
        @Schema(description = "Area unit") String areaUnit,
        @Schema(description = "Urgency level") Urgency urgency,
        @Schema(description = "Preferred start date") LocalDate preferredDateFrom,
        @Schema(description = "Preferred end date") LocalDate preferredDateTo,
        @Schema(description = "Dynamic form data") String formData,
        @Schema(description = "Expiration timestamp") Instant expiresAt,
        @Schema(description = "Photos") List<RequestPhotoResponse> photos,
        @Schema(description = "Number of proposals") int proposalCount,
        @Schema(description = "Created at") Instant createdAt,
        @Schema(description = "Updated at") Instant updatedAt
) {}
