package com.agroconnect.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "agroconnect.jwt")
public record JwtProperties(
        String secret,
        long accessTokenExpiration,
        long refreshTokenExpiration
) {}
