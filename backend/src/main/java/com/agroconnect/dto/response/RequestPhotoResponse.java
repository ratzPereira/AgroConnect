package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Request photo details")
public record RequestPhotoResponse(

        @Schema(description = "Photo ID") Long id,
        @Schema(description = "Photo URL") String photoUrl,
        @Schema(description = "Sort order") int sortOrder,
        @Schema(description = "Upload timestamp") Instant uploadedAt
) {}
