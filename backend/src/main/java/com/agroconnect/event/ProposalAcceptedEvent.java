package com.agroconnect.event;

import java.math.BigDecimal;
import java.time.Instant;

public record ProposalAcceptedEvent(
        Long requestId,
        Long proposalId,
        Long providerUserId,
        String providerEmail,
        String providerName,
        String clientName,
        String requestTitle,
        BigDecimal acceptedPrice,
        Instant occurredAt
) {}
