package com.agroconnect.controller;

import com.agroconnect.dto.request.LoginRequest;
import com.agroconnect.dto.request.RefreshTokenRequest;
import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.dto.response.AuthResponse;
import com.agroconnect.exception.GlobalExceptionHandler.ErrorResponse;
import com.agroconnect.security.UserPrincipal;
import com.agroconnect.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User authentication and token management")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Creates a new user account with a client or provider profile")
    @ApiResponse(responseCode = "201", description = "User registered successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input data",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Email already registered",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticates a user and returns JWT tokens")
    @ApiResponse(responseCode = "200", description = "Login successful")
    @ApiResponse(responseCode = "401", description = "Invalid credentials",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token", description = "Exchanges a valid refresh token for a new access token (token rotation)")
    @ApiResponse(responseCode = "200", description = "Token refreshed successfully")
    @ApiResponse(responseCode = "400", description = "Invalid or expired refresh token",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout", description = "Revokes all refresh tokens for the authenticated user")
    @ApiResponse(responseCode = "204", description = "Logged out successfully")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Void> logout(@AuthenticationPrincipal UserPrincipal principal) {
        authService.logout(principal.getId());
        return ResponseEntity.noContent().build();
    }
}
