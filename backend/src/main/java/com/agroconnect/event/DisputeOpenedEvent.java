package com.agroconnect.event;

import java.time.Instant;

public record DisputeOpenedEvent(
        Long disputeId,
        Long requestId,
        Long recipientUserId,
        String recipientEmail,
        String recipientName,
        String openedByName,
        String reason,
        Instant occurredAt
) {}
