package com.agroconnect.mapper;

import com.agroconnect.dto.response.ListingConversationResponse;
import com.agroconnect.dto.response.ListingMessageResponse;
import com.agroconnect.dto.response.ListingResponse;
import com.agroconnect.dto.response.ListingSummaryResponse;
import com.agroconnect.model.Listing;
import com.agroconnect.model.ListingConversation;
import com.agroconnect.model.ListingMessage;
import com.agroconnect.model.ListingPhoto;

import java.util.List;

public final class ListingMapper {

    private ListingMapper() {}

    public static ListingResponse toResponse(Listing listing,
                                             String sellerName,
                                             Double sellerRating,
                                             int sellerListingCount,
                                             List<String> photoUrls,
                                             long favoriteCount,
                                             boolean favorited) {
        Double lat = null;
        Double lng = null;
        if (listing.getLocation() != null) {
            lat = listing.getLocation().getY();
            lng = listing.getLocation().getX();
        }

        return new ListingResponse(
                listing.getId(),
                listing.getTitle(),
                listing.getDescription(),
                listing.getPrice(),
                listing.isPriceNegotiable(),
                listing.getCategory(),
                listing.getCondition(),
                listing.getQuantity(),
                listing.getUnit(),
                lat,
                lng,
                listing.getLocationName(),
                listing.getParish(),
                listing.getMunicipality(),
                listing.getIsland(),
                listing.getStatus(),
                listing.getViewsCount(),
                listing.getSeller().getId(),
                sellerName,
                sellerRating,
                sellerListingCount,
                photoUrls,
                favoriteCount,
                favorited,
                listing.getCreatedAt(),
                listing.getUpdatedAt(),
                listing.getExpiresAt()
        );
    }

    public static ListingSummaryResponse toSummaryResponse(Listing listing, String firstPhotoUrl) {
        Double lat = null;
        Double lng = null;
        if (listing.getLocation() != null) {
            lat = listing.getLocation().getY();
            lng = listing.getLocation().getX();
        }

        return new ListingSummaryResponse(
                listing.getId(),
                listing.getTitle(),
                listing.getPrice(),
                listing.isPriceNegotiable(),
                listing.getCategory(),
                listing.getCondition(),
                listing.getIsland(),
                listing.getLocationName(),
                firstPhotoUrl,
                lat,
                lng,
                listing.getCreatedAt(),
                listing.getStatus(),
                listing.getViewsCount()
        );
    }

    public static ListingConversationResponse toConversationResponse(ListingConversation conv,
                                                                      String otherPartyName,
                                                                      Long otherPartyId,
                                                                      String lastMessage,
                                                                      long unreadCount) {
        Listing listing = conv.getListing();
        String firstPhoto = null;
        if (listing.getPhotos() != null && !listing.getPhotos().isEmpty()) {
            firstPhoto = listing.getPhotos().stream()
                    .findFirst()
                    .map(ListingPhoto::getPhotoUrl)
                    .orElse(null);
        }

        return new ListingConversationResponse(
                conv.getId(),
                listing.getId(),
                listing.getTitle(),
                firstPhoto,
                otherPartyId,
                otherPartyName,
                lastMessage,
                conv.getLastMessageAt(),
                unreadCount
        );
    }

    public static ListingMessageResponse toMessageResponse(ListingMessage msg, String senderName) {
        return new ListingMessageResponse(
                msg.getId(),
                msg.getSender().getId(),
                senderName,
                msg.getContent(),
                msg.getSentAt(),
                msg.getReadAt()
        );
    }
}
