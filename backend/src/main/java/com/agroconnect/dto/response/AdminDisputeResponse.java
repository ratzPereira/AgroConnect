package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.Instant;

@Schema(description = "Admin view of a dispute")
public record AdminDisputeResponse(

        @Schema(description = "Request ID") Long requestId,
        @Schema(description = "Client name") String clientName,
        @Schema(description = "Provider name") String providerName,
        @Schema(description = "Request title") String requestTitle,
        @Schema(description = "Transaction amount") BigDecimal amount,
        @Schema(description = "When the request was created") Instant createdAt
) {}
