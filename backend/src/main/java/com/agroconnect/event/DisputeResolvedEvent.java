package com.agroconnect.event;

import java.time.Instant;

public record DisputeResolvedEvent(
        Long disputeId,
        Long requestId,
        Long recipientUserId,
        String recipientEmail,
        String recipientName,
        String resolution,
        Instant occurredAt
) {}
