package com.agroconnect.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "agroconnect.rate-limit")
public record RateLimitProperties(
        int loginMax,
        int loginWindowSeconds,
        int registerMax,
        int registerWindowSeconds,
        int apiDefaultMax,
        int apiDefaultWindowSeconds
) {}
