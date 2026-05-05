package com.agroconnect.dto.response;

import com.agroconnect.model.enums.ListingCategory;
import com.agroconnect.model.enums.ListingCondition;
import com.agroconnect.model.enums.ListingStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Schema(description = "Full listing details")
public record ListingResponse(

        @Schema(description = "Listing ID") Long id,
        @Schema(description = "Listing title") String title,
        @Schema(description = "Detailed description") String description,
        @Schema(description = "Price in EUR (null = price on request)") BigDecimal price,
        @Schema(description = "Whether the price is negotiable") boolean priceNegotiable,
        @Schema(description = "Listing category") ListingCategory category,
        @Schema(description = "Item condition") ListingCondition condition,
        @Schema(description = "Quantity available") BigDecimal quantity,
        @Schema(description = "Unit of measure") String unit,
        @Schema(description = "Location latitude") Double latitude,
        @Schema(description = "Location longitude") Double longitude,
        @Schema(description = "Human-readable location name") String locationName,
        @Schema(description = "Parish name") String parish,
        @Schema(description = "Municipality name") String municipality,
        @Schema(description = "Island name") String island,
        @Schema(description = "Listing status") ListingStatus status,
        @Schema(description = "Number of views") int viewsCount,
        @Schema(description = "Seller user ID") Long sellerId,
        @Schema(description = "Seller display name") String sellerName,
        @Schema(description = "Seller average rating") Double sellerRating,
        @Schema(description = "Total active listings by this seller") int sellerListingCount,
        @Schema(description = "Photo URLs ordered by sort order") List<String> photoUrls,
        @Schema(description = "Number of users who favorited this listing") long favoriteCount,
        @Schema(description = "Whether the current user has favorited this listing") boolean favorited,
        @Schema(description = "When the listing was created") Instant createdAt,
        @Schema(description = "When the listing was last updated") Instant updatedAt,
        @Schema(description = "When the listing expires") Instant expiresAt
) {}
