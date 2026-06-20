package com.agroconnect.event;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentReleasedEvent(
        Long transactionId,
        Long requestId,
        Long providerUserId,
        String providerEmail,
        String providerName,
        BigDecimal amount,
        Instant occurredAt
) {}
