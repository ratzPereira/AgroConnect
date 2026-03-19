package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Provider profile information")
public record ProviderProfileResponse(

        @Schema(description = "Profile ID", example = "1")
        Long id,

        @Schema(description = "Company name", example = "AgroServiços Terceira Lda")
        String companyName,

        @Schema(description = "Tax identification number", example = "123456789")
        String nif,

        @Schema(description = "Phone number", example = "+351912345678")
        String phone,

        @Schema(description = "Company bio / description", example = "Serviços agrícolas na ilha Terceira")
        String description,

        @Schema(description = "Service radius in kilometers", example = "30.0")
        Double serviceRadiusKm,

        @Schema(description = "Average review rating (0-5)", example = "4.5")
        Double avgRating,

        @Schema(description = "Total number of reviews", example = "12")
        Integer totalReviews,

        @Schema(description = "Whether the provider is verified", example = "true")
        Boolean verified,

        @Schema(description = "Location latitude", example = "38.6667")
        Double latitude,

        @Schema(description = "Location longitude", example = "-27.2167")
        Double longitude
) {}
