package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Schema(description = "Complete export of user's personal data (GDPR)")
public record DataExportResponse(
        @Schema(description = "User account information") UserData user,
        @Schema(description = "Service requests created") List<RequestData> requests,
        @Schema(description = "Proposals submitted") List<ProposalData> proposals,
        @Schema(description = "Financial transactions") List<TransactionData> transactions,
        @Schema(description = "Reviews written") List<ReviewData> reviews,
        @Schema(description = "Chat messages sent") List<MessageData> messages,
        @Schema(description = "Notifications received") List<NotificationData> notifications,
        @Schema(description = "Export timestamp") Instant exportedAt
) {
    @Schema(description = "User account data")
    public record UserData(
            @Schema(description = "Email address") String email,
            @Schema(description = "Full name") String name,
            @Schema(description = "Phone number") String phone,
            @Schema(description = "User role") String role,
            @Schema(description = "Parish") String parish,
            @Schema(description = "Municipality") String municipality,
            @Schema(description = "Island") String island,
            @Schema(description = "Account creation date") Instant createdAt) {}

    @Schema(description = "Service request data")
    public record RequestData(
            @Schema(description = "Request ID") Long id,
            @Schema(description = "Request title") String title,
            @Schema(description = "Request description") String description,
            @Schema(description = "Request status") String status,
            @Schema(description = "Service category") String categoryName,
            @Schema(description = "Area in hectares") Double area,
            @Schema(description = "Urgency level") String urgency,
            @Schema(description = "Creation date") Instant createdAt) {}

    @Schema(description = "Proposal data")
    public record ProposalData(
            @Schema(description = "Proposal ID") Long id,
            @Schema(description = "Related request ID") Long requestId,
            @Schema(description = "Proposed price") BigDecimal price,
            @Schema(description = "Proposal status") String status,
            @Schema(description = "Proposal description") String description,
            @Schema(description = "Creation date") Instant createdAt) {}

    @Schema(description = "Financial transaction data")
    public record TransactionData(
            @Schema(description = "Transaction ID") Long id,
            @Schema(description = "Total amount") BigDecimal amount,
            @Schema(description = "Commission amount") BigDecimal commissionAmount,
            @Schema(description = "Provider payout") BigDecimal providerPayout,
            @Schema(description = "Transaction status") String status,
            @Schema(description = "Creation date") Instant createdAt) {}

    @Schema(description = "Review data")
    public record ReviewData(
            @Schema(description = "Review ID") Long id,
            @Schema(description = "Related request ID") Long requestId,
            @Schema(description = "Rating (1-5)") int rating,
            @Schema(description = "Review comment") String comment,
            @Schema(description = "Creation date") Instant createdAt) {}

    @Schema(description = "Chat message data")
    public record MessageData(
            @Schema(description = "Message ID") Long id,
            @Schema(description = "Related request ID") Long requestId,
            @Schema(description = "Message content") String content,
            @Schema(description = "Sent timestamp") Instant sentAt) {}

    @Schema(description = "Notification data")
    public record NotificationData(
            @Schema(description = "Notification ID") Long id,
            @Schema(description = "Notification title") String title,
            @Schema(description = "Notification body") String body,
            @Schema(description = "Notification type") String type,
            @Schema(description = "Read status") boolean read,
            @Schema(description = "Creation date") Instant createdAt) {}
}
