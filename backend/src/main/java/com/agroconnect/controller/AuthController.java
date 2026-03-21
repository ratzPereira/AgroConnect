package com.agroconnect.controller;

import com.agroconnect.dto.request.ForgotPasswordRequest;
import com.agroconnect.dto.request.LoginRequest;
import com.agroconnect.dto.request.RefreshTokenRequest;
import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.dto.request.ResendVerificationRequest;
import com.agroconnect.dto.request.ResetPasswordRequest;
import com.agroconnect.dto.response.AuthResponse;
import com.agroconnect.dto.response.MessageResponse;
import com.agroconnect.exception.GlobalExceptionHandler.ErrorResponse;
import com.agroconnect.security.RateLimit;
import com.agroconnect.security.UserPrincipal;
import com.agroconnect.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User authentication and token management")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(
            summary = "Register a new user",
            description = "Creates a new user account with a client or provider profile. Sends a verification email. No auth tokens are returned — the user must verify their email before logging in."
    )
    @ApiResponse(responseCode = "201", description = "User registered successfully. Verification email sent.")
    @ApiResponse(responseCode = "400", description = "Invalid input data",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Email already registered",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "429", description = "Too many registration attempts",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @RateLimit(requests = 3, windowSeconds = 60)
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest request) {
        MessageResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(
            summary = "Login",
            description = "Authenticates a user and returns JWT tokens. Requires email verification. Brute-force protection is active."
    )
    @ApiResponse(responseCode = "200", description = "Login successful")
    @ApiResponse(responseCode = "401", description = "Invalid credentials",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Email not verified or account suspended",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "429", description = "Too many login attempts — account temporarily locked",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @RateLimit(requests = 5, windowSeconds = 60)
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = extractClientIp(httpRequest);
        AuthResponse response = authService.login(request, clientIp);
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

    @GetMapping("/verify-email")
    @Operation(
            summary = "Verify email address",
            description = "Verifies a user's email address using the token sent via the verification email"
    )
    @ApiResponse(responseCode = "200", description = "Email verified successfully")
    @ApiResponse(responseCode = "400", description = "Token expired or already used",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Invalid token",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "429", description = "Too many requests",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @RateLimit(requests = 10, windowSeconds = 60)
    public ResponseEntity<MessageResponse> verifyEmail(
            @Parameter(description = "Email verification token from the verification email")
            @RequestParam String token) {
        MessageResponse response = authService.verifyEmail(token);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-verification")
    @Operation(
            summary = "Resend email verification",
            description = "Resends the verification email. Always returns 200 to prevent email enumeration."
    )
    @ApiResponse(responseCode = "200", description = "Verification email sent if account exists and is unverified")
    @ApiResponse(responseCode = "400", description = "Invalid input data",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "429", description = "Too many requests",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @RateLimit(requests = 3, windowSeconds = 60)
    public ResponseEntity<MessageResponse> resendVerification(
            @Valid @RequestBody ResendVerificationRequest request) {
        MessageResponse response = authService.resendVerification(request.email());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    @Operation(
            summary = "Request password reset",
            description = "Sends a password reset email. Always returns 200 to prevent email enumeration."
    )
    @ApiResponse(responseCode = "200", description = "Reset email sent if account exists and is verified")
    @ApiResponse(responseCode = "400", description = "Invalid input data",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "429", description = "Too many requests",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @RateLimit(requests = 3, windowSeconds = 60)
    public ResponseEntity<MessageResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        MessageResponse response = authService.forgotPassword(request.email());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    @Operation(
            summary = "Reset password with token",
            description = "Resets the user's password using the token from the reset email. Revokes all existing sessions."
    )
    @ApiResponse(responseCode = "200", description = "Password reset successfully")
    @ApiResponse(responseCode = "400", description = "Token expired, already used, or invalid password",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Invalid token",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "429", description = "Too many requests",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @RateLimit(requests = 5, windowSeconds = 60)
    public ResponseEntity<MessageResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        MessageResponse response = authService.resetPassword(request);
        return ResponseEntity.ok(response);
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            // X-Forwarded-For may contain a comma-separated list; the first is the client IP
            return forwardedFor.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
