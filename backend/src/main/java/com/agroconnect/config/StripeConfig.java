package com.agroconnect.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(StripeProperties.class)
@RequiredArgsConstructor
public class StripeConfig {

    private static final Logger log = LoggerFactory.getLogger(StripeConfig.class);
    private static final int MAX_NETWORK_RETRIES = 2;

    private final StripeProperties properties;

    @PostConstruct
    public void init() {
        Stripe.apiKey = properties.secretKey();
        Stripe.setMaxNetworkRetries(MAX_NETWORK_RETRIES);

        if (properties.secretKey() == null || properties.secretKey().equals("sk_test_placeholder")) {
            log.warn("Stripe secret key is a placeholder. Stripe API calls will fail.");
        } else if (properties.secretKey().startsWith("sk_live_")) {
            log.error("Stripe is configured with a LIVE key. AgroConnect should run in test mode only.");
        } else {
            log.info("Stripe initialised in test mode (key prefix: {})",
                    properties.secretKey().substring(0, Math.min(7, properties.secretKey().length())));
        }
    }
}
