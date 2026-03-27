package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Listing message details")
public record ListingMessageResponse(

        @Schema(description = "Message ID") Long id,
        @Schema(description = "Sender user ID") Long senderId,
        @Schema(description = "Sender display name") String senderName,
        @Schema(description = "Message content") String content,
        @Schema(description = "When the message was sent") Instant sentAt,
        @Schema(description = "When the message was read (null if unread)") Instant readAt
) {}
