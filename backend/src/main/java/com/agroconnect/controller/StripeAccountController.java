package com.agroconnect.controller;

import com.agroconnect.dto.response.StripeAccountStatusResponse;
import com.agroconnect.dto.response.StripeOnboardingResponse;
import com.agroconnect.exception.GlobalExceptionHandler.ErrorResponse;
import com.agroconnect.security.UserPrincipal;
import com.agroconnect.service.StripeAccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/stripe/account")
@RequiredArgsConstructor
@Tag(name = "Stripe Connect", description = "Provider onboarding into Stripe Connect (Express) for receiving payments")
@PreAuthorize("hasRole('PROVIDER_MANAGER')")
public class StripeAccountController {

    private final StripeAccountService accountService;

    @PostMapping("/onboard")
    @Operation(
            summary = "Start or resume Stripe onboarding",
            description = "Creates an Express connected account if one does not yet exist for the provider, " +
                    "then returns a hosted Stripe onboarding URL. The frontend should redirect the user to this URL. " +
                    "After the user completes the form, Stripe redirects them back to the configured return URL."
    )
    @ApiResponse(responseCode = "200", description = "Onboarding link created")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Provider profile not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "502", description = "Stripe API error",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<StripeOnboardingResponse> startOnboarding(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(accountService.startOnboarding(principal.getId()));
    }

    @GetMapping("/status")
    @Operation(
            summary = "Get current Stripe account status",
            description = "Returns the cached onboarding state for the authenticated provider. " +
                    "Use ?refresh=true to force a sync with Stripe (e.g., immediately after the user returns from the hosted onboarding flow)."
    )
    @ApiResponse(responseCode = "200", description = "Account status")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Provider profile not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<StripeAccountStatusResponse> getStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "false") boolean refresh) {
        StripeAccountStatusResponse response = refresh
                ? accountService.syncFromStripe(principal.getId())
                : accountService.getStatus(principal.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh-link")
    @Operation(
            summary = "Regenerate the onboarding link",
            description = "Stripe AccountLinks expire after a few minutes. Use this endpoint to get a fresh URL " +
                    "without creating a new connected account."
    )
    @ApiResponse(responseCode = "200", description = "New onboarding link")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Provider profile not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<StripeOnboardingResponse> refreshLink(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(accountService.startOnboarding(principal.getId()));
    }
}
