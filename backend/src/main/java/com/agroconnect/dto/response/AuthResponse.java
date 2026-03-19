package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Authentication response with tokens and user info")
public record AuthResponse(

        @Schema(description = "JWT access token")
        String accessToken,

        @Schema(description = "Refresh token for obtaining new access tokens")
        String refreshToken,

        @Schema(description = "Access token expiration time in milliseconds", example = "900000")
        long expiresIn,

        @Schema(description = "Authenticated user information")
        UserResponse user
) {}
