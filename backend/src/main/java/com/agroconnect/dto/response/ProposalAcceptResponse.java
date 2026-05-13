package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

@Schema(description = "Result of accepting a proposal — includes the Stripe PaymentIntent client secret " +
        "the frontend must use to confirm the payment. The acceptance only completes (proposal moves to " +
        "ACCEPTED, request to AWARDED, others rejected) after the payment_intent.succeeded webhook fires.")
public record ProposalAcceptResponse(

        @Schema(description = "Internal transaction ID (escrow record)") Long transactionId,
        @Schema(description = "Proposal ID that was accepted") Long proposalId,
        @Schema(description = "Stripe PaymentIntent ID", example = "pi_3ABCxyz") String paymentIntentId,
        @Schema(description = "Client secret for confirming the payment via Stripe.js — DO NOT log") String clientSecret,
        @Schema(description = "Total amount the client will be charged (EUR)") BigDecimal amount,
        @Schema(description = "Stripe publishable key (so the frontend can boot Stripe.js)") String publishableKey
) {}
