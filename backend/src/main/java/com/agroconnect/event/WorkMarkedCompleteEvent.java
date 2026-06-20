package com.agroconnect.event;

import java.time.Instant;

public record WorkMarkedCompleteEvent(
        Long requestId,
        Long clientUserId,
        String clientEmail,
        String clientName,
        String providerName,
        Instant occurredAt
) {}
