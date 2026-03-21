package com.agroconnect.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "agroconnect.security")
public record SecurityProperties(
        int bruteForceMaxAttempts,
        int bruteForceLockoutMinutes,
        int emailVerificationExpiryHours,
        int passwordResetExpiryMinutes
) {}
