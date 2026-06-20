package com.agroconnect.event;

import java.time.Instant;

public record RatingReceivedEvent(
        Long ratingId,
        Long raterUserId,
        Long rateeUserId,
        String rateeEmail,
        String rateeName,
        String raterName,
        int stars,
        String comment,
        Instant occurredAt
) {}
