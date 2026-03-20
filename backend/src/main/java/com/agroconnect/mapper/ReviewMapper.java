package com.agroconnect.mapper;

import com.agroconnect.dto.response.ReviewResponse;
import com.agroconnect.model.Review;

public final class ReviewMapper {

    private ReviewMapper() {}

    public static ReviewResponse toResponse(Review review, String authorName, String targetName) {
        return new ReviewResponse(
                review.getId(),
                review.getRequest().getId(),
                review.getAuthor().getId(),
                authorName,
                review.getTarget().getId(),
                targetName,
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}
