package com.agroconnect.dto.response;

import com.agroconnect.model.enums.TransactionStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.Instant;

@Schema(description = "Transaction/payment details")
public record TransactionResponse(

        @Schema(description = "Transaction ID") Long id,
        @Schema(description = "Request ID") Long requestId,
        @Schema(description = "Proposal ID") Long proposalId,
        @Schema(description = "Total amount") BigDecimal amount,
        @Schema(description = "Commission rate") BigDecimal commissionRate,
        @Schema(description = "Commission amount") BigDecimal commissionAmount,
        @Schema(description = "Provider payout") BigDecimal providerPayout,
        @Schema(description = "Transaction status") TransactionStatus status,
        @Schema(description = "Held at") Instant heldAt,
        @Schema(description = "Released at") Instant releasedAt,
        @Schema(description = "Refunded at") Instant refundedAt,
        @Schema(description = "Created at") Instant createdAt
) {}
