package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Chat message details")
public record ChatMessageResponse(

        @Schema(description = "Message ID") Long id,
        @Schema(description = "Sender user ID") Long senderId,
        @Schema(description = "Sender display name") String senderName,
        @Schema(description = "Message content") String content,
        @Schema(description = "When the message was sent") Instant sentAt
) {}
