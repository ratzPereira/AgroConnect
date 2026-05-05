package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Execution photo details")
public record ExecutionPhotoResponse(

        @Schema(description = "Photo ID") Long id,
        @Schema(description = "Photo URL") String photoUrl,
        @Schema(description = "Photo latitude") Double latitude,
        @Schema(description = "Photo longitude") Double longitude,
        @Schema(description = "Taken at") Instant takenAt,
        @Schema(description = "Uploaded at") Instant uploadedAt
) {}
