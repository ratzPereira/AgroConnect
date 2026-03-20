package com.agroconnect.fixture;

import com.agroconnect.model.Review;

import java.time.Instant;

public final class ReviewFixture {

    private ReviewFixture() {}

    public static Review.ReviewBuilder aReview() {
        return Review.builder()
                .id(1L)
                .rating(5)
                .comment("Excelente trabalho, muito profissional e pontual.")
                .createdAt(Instant.now());
    }
}
