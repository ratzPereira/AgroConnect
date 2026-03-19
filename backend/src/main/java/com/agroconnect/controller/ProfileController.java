package com.agroconnect.controller;

import com.agroconnect.dto.request.UpdateClientProfileRequest;
import com.agroconnect.dto.request.UpdateProviderProfileRequest;
import com.agroconnect.dto.response.ClientProfileResponse;
import com.agroconnect.dto.response.ProviderProfileResponse;
import com.agroconnect.exception.GlobalExceptionHandler.ErrorResponse;
import com.agroconnect.security.UserPrincipal;
import com.agroconnect.service.UserProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/profile")
@RequiredArgsConstructor
@Tag(name = "User Profiles", description = "Manage user profiles")
public class ProfileController {

    private final UserProfileService profileService;

    @GetMapping("/me")
    @Operation(summary = "Get my profile", description = "Returns the current user's profile based on their role (client or provider)")
    @ApiResponse(responseCode = "200", description = "Profile retrieved successfully")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Profile not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Object> getMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        Object profile = profileService.getMyProfile(principal.getId());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/me/client")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Update client profile", description = "Updates the authenticated client's profile information")
    @ApiResponse(responseCode = "200", description = "Profile updated successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input data",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Only clients can update client profiles",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Profile not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ClientProfileResponse> updateClientProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateClientProfileRequest request) {
        ClientProfileResponse response = profileService.updateClientProfile(principal.getId(), request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me/provider")
    @PreAuthorize("hasRole('PROVIDER_MANAGER')")
    @Operation(summary = "Update provider profile", description = "Updates the authenticated provider manager's profile information")
    @ApiResponse(responseCode = "200", description = "Profile updated successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input data",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Only provider managers can update provider profiles",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Profile not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ProviderProfileResponse> updateProviderProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProviderProfileRequest request) {
        ProviderProfileResponse response = profileService.updateProviderProfile(principal.getId(), request);
        return ResponseEntity.ok(response);
    }
}
