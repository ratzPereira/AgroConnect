package com.agroconnect.dto.response;

import com.agroconnect.model.enums.ListingCategory;
import com.agroconnect.model.enums.ListingCondition;
import com.agroconnect.model.enums.ListingStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.Instant;

@Schema(description = "Listing summary for list views")
public record ListingSummaryResponse(

        @Schema(description = "Listing ID") Long id,
        @Schema(description = "Listing title") String title,
        @Schema(description = "Price in EUR (null = price on request)") BigDecimal price,
        @Schema(description = "Whether the price is negotiable") boolean priceNegotiable,
        @Schema(description = "Listing category") ListingCategory category,
        @Schema(description = "Item condition") ListingCondition condition,
        @Schema(description = "Island name") String island,
        @Schema(description = "Human-readable location name") String locationName,
        @Schema(description = "First photo URL (null if no photos)") String firstPhotoUrl,
        @Schema(description = "Latitude") Double latitude,
        @Schema(description = "Longitude") Double longitude,
        @Schema(description = "When the listing was created") Instant createdAt,
        @Schema(description = "Listing status") ListingStatus status,
        @Schema(description = "Number of views") int viewsCount
) {}
