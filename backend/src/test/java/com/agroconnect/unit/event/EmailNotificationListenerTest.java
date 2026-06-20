package com.agroconnect.unit.event;

import com.agroconnect.event.DisputeOpenedEvent;
import com.agroconnect.event.DisputeResolvedEvent;
import com.agroconnect.event.PaymentReleasedEvent;
import com.agroconnect.event.ProposalAcceptedEvent;
import com.agroconnect.event.ProposalReceivedEvent;
import com.agroconnect.event.RatingReceivedEvent;
import com.agroconnect.event.RequestExpiredEvent;
import com.agroconnect.event.WorkMarkedCompleteEvent;
import com.agroconnect.event.listener.EmailNotificationListener;
import com.agroconnect.service.EmailService;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

class EmailNotificationListenerTest {

    private EmailService emailService;
    private SimpleMeterRegistry meterRegistry;
    private EmailNotificationListener listener;

    @BeforeEach
    void setUp() {
        emailService = mock(EmailService.class);
        meterRegistry = new SimpleMeterRegistry();
        listener = new EmailNotificationListener(emailService, meterRegistry);
    }

    @Test
    void on_proposalReceived_shouldDelegateAndCount() {
        var event = new ProposalReceivedEvent(1L, 2L, 3L, "client@example.pt",
                "Ana", "Maria Provider", "Lavoura", Instant.now());

        listener.on(event);

        verify(emailService).sendProposalReceivedEmail(event);
        assertSentCount("proposal_received", 1.0);
    }

    @Test
    void on_proposalAccepted_shouldDelegateAndCount() {
        var event = new ProposalAcceptedEvent(1L, 2L, 3L, "provider@example.pt",
                "Maria Provider", "Ana Client", "Lavoura", new BigDecimal("150.00"), Instant.now());

        listener.on(event);

        verify(emailService).sendProposalAcceptedEmail(event);
        assertSentCount("proposal_accepted", 1.0);
    }

    @Test
    void on_workMarkedComplete_shouldDelegateAndCount() {
        var event = new WorkMarkedCompleteEvent(1L, 2L, "client@example.pt",
                "Ana Client", "Maria Provider", Instant.now());

        listener.on(event);

        verify(emailService).sendWorkMarkedCompleteEmail(event);
        assertSentCount("work_marked_complete", 1.0);
    }

    @Test
    void on_paymentReleased_shouldDelegateAndCount() {
        var event = new PaymentReleasedEvent(1L, 2L, 3L, "provider@example.pt",
                "Maria Provider", new BigDecimal("142.50"), Instant.now());

        listener.on(event);

        verify(emailService).sendPaymentReleasedEmail(event);
        assertSentCount("payment_released", 1.0);
    }

    @Test
    void on_ratingReceived_shouldDelegateAndCount() {
        var event = new RatingReceivedEvent(1L, 2L, 3L, "ratee@example.pt",
                "Ratee Name", "Rater Name", 5, "Great work", Instant.now());

        listener.on(event);

        verify(emailService).sendRatingReceivedEmail(event);
        assertSentCount("rating_received", 1.0);
    }

    @Test
    void on_disputeOpened_shouldDelegateAndCount() {
        var event = new DisputeOpenedEvent(1L, 2L, 3L, "recipient@example.pt",
                "Recipient Name", "Opener Name", "Trabalho mal feito", Instant.now());

        listener.on(event);

        verify(emailService).sendDisputeOpenedEmail(event);
        assertSentCount("dispute_opened", 1.0);
    }

    @Test
    void on_disputeResolved_shouldDelegateAndCount() {
        var event = new DisputeResolvedEvent(1L, 2L, 3L, "recipient@example.pt",
                "Recipient Name", "Resolvido a favor do cliente", Instant.now());

        listener.on(event);

        verify(emailService).sendDisputeResolvedEmail(event);
        assertSentCount("dispute_resolved", 1.0);
    }

    @Test
    void on_requestExpired_shouldDelegateAndCount() {
        var event = new RequestExpiredEvent(1L, 2L, "client@example.pt",
                "Ana Client", "Lavoura urgente", Instant.now().minusSeconds(3600), Instant.now());

        listener.on(event);

        verify(emailService).sendRequestExpiredEmail(event);
        assertSentCount("request_expired", 1.0);
    }

    @Test
    void on_ratingReceived_whenSelfRating_shouldSkipEmail() {
        var event = new RatingReceivedEvent(1L, 5L, 5L, "x@x.pt",
                "Eu", "Eu", 5, "comment", Instant.now());

        listener.on(event);

        verifyNoInteractions(emailService);
        assertThat(meterRegistry.find("agroconnect_emails_sent_total")
                .tag("event", "rating_received").counter()).isNull();
    }

    @Test
    void recover_shouldIncrementFailedCounter() {
        var event = new ProposalReceivedEvent(1L, 2L, 3L, "c@x.pt",
                "Ana", "Maria", "Lavoura", Instant.now());

        listener.recover(new RuntimeException("boom"), event);

        assertThat(meterRegistry.counter("agroconnect_emails_failed_total",
                "event", "ProposalReceivedEvent",
                "reason", "RuntimeException").count()).isEqualTo(1.0);
    }

    private void assertSentCount(String eventTag, double expected) {
        assertThat(meterRegistry.counter("agroconnect_emails_sent_total", "event", eventTag).count())
                .isEqualTo(expected);
    }
}
