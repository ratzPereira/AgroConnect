package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Listing conversation summary for inbox")
public record ListingConversationResponse(

        @Schema(description = "Conversation ID") Long id,
        @Schema(description = "Listing ID") Long listingId,
        @Schema(description = "Listing title") String listingTitle,
        @Schema(description = "First photo of the listing") String listingFirstPhoto,
        @Schema(description = "The other participant's user ID") Long otherPartyId,
        @Schema(description = "The other participant's display name") String otherPartyName,
        @Schema(description = "Content of the last message") String lastMessage,
        @Schema(description = "When the last message was sent") Instant lastMessageAt,
        @Schema(description = "Number of unread messages") long unreadCount
) {}
