package com.agroconnect.event;

import java.time.Instant;

public record RequestExpiredEvent(
        Long requestId,
        Long clientUserId,
        String clientEmail,
        String clientName,
        String requestTitle,
        Instant publishedAt,
        Instant occurredAt
) {}
