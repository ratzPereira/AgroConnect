package com.agroconnect.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "agroconnect.jwt")
public record JwtProperties(
        @NotBlank
        @Size(min = 32, message = "JWT secret must be at least 32 characters (HS256 requires 256-bit key).")
        String secret,
        @Positive long accessTokenExpiration,
        @Positive long refreshTokenExpiration
) {}
