package com.agroconnect.controller;

import com.agroconnect.exception.StripeIntegrationException;
import com.agroconnect.service.StripeService;
import com.agroconnect.service.StripeWebhookService;
import com.stripe.model.Event;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/webhooks/stripe")
@RequiredArgsConstructor
@Tag(name = "Stripe Webhooks", description = "Receives Stripe event callbacks (signature-protected)")
public class StripeWebhookController {

    private static final Logger log = LoggerFactory.getLogger(StripeWebhookController.class);

    private final StripeService stripeService;
    private final StripeWebhookService webhookService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "Stripe webhook receiver",
            description = "Endpoint registered with Stripe. The raw JSON body is verified against the " +
                    "Stripe-Signature header before any processing. Returns 200 immediately on success " +
                    "or duplicate delivery; 400 on invalid signature; 500 on transient failure to trigger Stripe retry."
    )
    @ApiResponse(responseCode = "200", description = "Event accepted (processed or duplicate)")
    @ApiResponse(responseCode = "400", description = "Missing or invalid Stripe signature")
    public ResponseEntity<Void> receive(
            @RequestBody String payload,
            @Parameter(description = "Stripe-Signature header — required for HMAC verification")
            @RequestHeader("Stripe-Signature") String signature) {

        Event event;
        try {
            event = stripeService.verifyWebhookSignature(payload, signature);
        } catch (StripeIntegrationException e) {
            log.warn("Rejected Stripe webhook: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }

        webhookService.handle(event);
        return ResponseEntity.ok().build();
    }
}
