package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Seller marketplace statistics")
public record ListingStatsResponse(

        @Schema(description = "Number of active listings") long activeCount,
        @Schema(description = "Number of sold listings") long soldCount,
        @Schema(description = "Total views across all listings") long totalViews,
        @Schema(description = "Total conversations across all listings") long totalConversations
) {}
