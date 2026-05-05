package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Notification details")
public record NotificationResponse(

        @Schema(description = "Notification ID") Long id,
        @Schema(description = "Notification type") String type,
        @Schema(description = "Title") String title,
        @Schema(description = "Body") String body,
        @Schema(description = "Extra data (JSON)") String data,
        @Schema(description = "Read status") boolean read,
        @Schema(description = "Created at") Instant createdAt,
        @Schema(description = "Navigation link derived from data") String link
) {}
