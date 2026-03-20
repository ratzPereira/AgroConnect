package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Unread notification count")
public record UnreadCountResponse(

        @Schema(description = "Number of unread notifications") long count
) {}
