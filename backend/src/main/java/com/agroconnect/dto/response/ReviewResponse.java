package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Review details")
public record ReviewResponse(

        @Schema(description = "Review ID") Long id,
        @Schema(description = "Request ID") Long requestId,
        @Schema(description = "Author user ID") Long authorId,
        @Schema(description = "Author name") String authorName,
        @Schema(description = "Target user ID") Long targetId,
        @Schema(description = "Target name") String targetName,
        @Schema(description = "Rating (1-5)") int rating,
        @Schema(description = "Comment") String comment,
        @Schema(description = "Created at") Instant createdAt
) {}
