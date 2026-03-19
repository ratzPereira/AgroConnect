package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Service category information")
public record CategoryResponse(

        @Schema(description = "Category ID", example = "1")
        Long id,

        @Schema(description = "Category name", example = "Preparação de Solo")
        String name,

        @Schema(description = "Category slug", example = "preparacao-solo")
        String slug,

        @Schema(description = "Category description", example = "Lavrar, gradar e preparar terrenos para cultivo")
        String description,

        @Schema(description = "Category icon URL")
        String iconUrl,

        @Schema(description = "Supported pricing models", example = "[\"FIXED\", \"PER_UNIT\"]")
        List<String> pricingModels
) {}
