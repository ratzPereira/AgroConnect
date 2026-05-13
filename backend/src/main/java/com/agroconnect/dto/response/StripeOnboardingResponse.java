package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Stripe Express onboarding link")
public record StripeOnboardingResponse(

        @Schema(description = "Stripe connected account ID", example = "acct_1ABCxyz") String accountId,
        @Schema(description = "Hosted onboarding URL — redirect the provider here") String onboardingUrl,
        @Schema(description = "Unix timestamp when the onboarding URL expires") long expiresAt
) {}
