package com.agroconnect.event;

import java.time.Instant;

public record ProposalReceivedEvent(
        Long requestId,
        Long proposalId,
        Long clientUserId,
        String clientEmail,
        String clientName,
        String providerDisplayName,
        String requestTitle,
        Instant occurredAt
) {}
