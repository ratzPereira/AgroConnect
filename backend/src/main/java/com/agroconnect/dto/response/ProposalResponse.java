package com.agroconnect.dto.response;

import com.agroconnect.model.enums.PricingModel;
import com.agroconnect.model.enums.ProposalStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Schema(description = "Proposal details")
public record ProposalResponse(

        @Schema(description = "Proposal ID") Long id,
        @Schema(description = "Request ID") Long requestId,
        @Schema(description = "Provider profile ID") Long providerId,
        @Schema(description = "Provider company name") String providerName,
        @Schema(description = "Provider average rating") double providerRating,
        @Schema(description = "Provider total reviews") int providerReviews,
        @Schema(description = "Proposal status") ProposalStatus status,
        @Schema(description = "Total price") BigDecimal price,
        @Schema(description = "Pricing model") PricingModel pricingModel,
        @Schema(description = "Unit price") BigDecimal unitPrice,
        @Schema(description = "Estimated units") Double estimatedUnits,
        @Schema(description = "Description") String description,
        @Schema(description = "What is included") String includesText,
        @Schema(description = "What is excluded") String excludesText,
        @Schema(description = "Estimated date") LocalDate estimatedDate,
        @Schema(description = "Valid until") Instant validUntil,
        @Schema(description = "Created at") Instant createdAt
) {}
