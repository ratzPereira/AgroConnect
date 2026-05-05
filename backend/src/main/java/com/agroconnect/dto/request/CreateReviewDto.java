package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "Create a review for a completed service")
public record CreateReviewDto(

        @NotNull
        @Min(1)
        @Max(5)
        @Schema(description = "Rating from 1 to 5")
        Integer rating,

        @NotBlank
        @Size(min = 10, max = 1000)
        @Schema(description = "Review comment (minimum 10 characters)")
        String comment
) {}
