package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Stripe connected account state for the authenticated provider")
public record StripeAccountStatusResponse(

        @Schema(description = "Stripe connected account ID, or null if onboarding never started") String accountId,
        @Schema(description = "Provider has completed onboarding form (KYC submitted)") boolean detailsSubmitted,
        @Schema(description = "Provider can accept charges (= ready to receive payments)") boolean chargesEnabled,
        @Schema(description = "Provider can receive payouts") boolean payoutsEnabled,
        @Schema(description = "Aggregated state: NOT_CONNECTED | PENDING | ACTIVE") String status
) {

    public static StripeAccountStatusResponse notConnected() {
        return new StripeAccountStatusResponse(null, false, false, false, "NOT_CONNECTED");
    }

    public static StripeAccountStatusResponse of(String accountId,
                                                 boolean detailsSubmitted,
                                                 boolean chargesEnabled,
                                                 boolean payoutsEnabled) {
        String status;
        if (chargesEnabled && payoutsEnabled) {
            status = "ACTIVE";
        } else {
            status = "PENDING";
        }
        return new StripeAccountStatusResponse(accountId, detailsSubmitted, chargesEnabled, payoutsEnabled, status);
    }
}
