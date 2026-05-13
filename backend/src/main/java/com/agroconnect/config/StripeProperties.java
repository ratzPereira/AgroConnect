package com.agroconnect.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "agroconnect.stripe")
public record StripeProperties(
        String secretKey,
        String publishableKey,
        String webhookSecret,
        String onboardingReturnUrl,
        String onboardingRefreshUrl
) {}
