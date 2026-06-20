package com.agroconnect.event.listener;

import com.agroconnect.event.DisputeOpenedEvent;
import com.agroconnect.event.DisputeResolvedEvent;
import com.agroconnect.event.PaymentReleasedEvent;
import com.agroconnect.event.ProposalAcceptedEvent;
import com.agroconnect.event.ProposalReceivedEvent;
import com.agroconnect.event.RatingReceivedEvent;
import com.agroconnect.event.RequestExpiredEvent;
import com.agroconnect.event.WorkMarkedCompleteEvent;
import com.agroconnect.service.EmailService;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class EmailNotificationListener {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationListener.class);
    private static final String METRIC_SENT = "agroconnect_emails_sent_total";
    private static final String METRIC_FAILED = "agroconnect_emails_failed_total";

    private final EmailService emailService;
    private final MeterRegistry meterRegistry;

    @Async("emailExecutor")
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000, multiplier = 2))
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(ProposalReceivedEvent event) {
        emailService.sendProposalReceivedEmail(event);
        countSent("proposal_received");
    }

    @Async("emailExecutor")
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000, multiplier = 2))
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(ProposalAcceptedEvent event) {
        emailService.sendProposalAcceptedEmail(event);
        countSent("proposal_accepted");
    }

    @Async("emailExecutor")
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000, multiplier = 2))
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(WorkMarkedCompleteEvent event) {
        emailService.sendWorkMarkedCompleteEmail(event);
        countSent("work_marked_complete");
    }

    @Async("emailExecutor")
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000, multiplier = 2))
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(PaymentReleasedEvent event) {
        emailService.sendPaymentReleasedEmail(event);
        countSent("payment_released");
    }

    @Async("emailExecutor")
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000, multiplier = 2))
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(RatingReceivedEvent event) {
        if (event.raterUserId() != null && event.raterUserId().equals(event.rateeUserId())) {
            log.debug("Skipping self-rating email for rating {}", event.ratingId());
            return;
        }
        emailService.sendRatingReceivedEmail(event);
        countSent("rating_received");
    }

    @Async("emailExecutor")
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000, multiplier = 2))
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(DisputeOpenedEvent event) {
        emailService.sendDisputeOpenedEmail(event);
        countSent("dispute_opened");
    }

    @Async("emailExecutor")
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000, multiplier = 2))
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(DisputeResolvedEvent event) {
        emailService.sendDisputeResolvedEmail(event);
        countSent("dispute_resolved");
    }

    @Async("emailExecutor")
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000, multiplier = 2))
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(RequestExpiredEvent event) {
        emailService.sendRequestExpiredEmail(event);
        countSent("request_expired");
    }

    @Recover
    public void recover(Exception e, Object event) {
        String type = event.getClass().getSimpleName();
        log.error("Email send failed after retries for {}: {}", type, e.getMessage());
        Counter.builder(METRIC_FAILED)
                .tag("event", type)
                .tag("reason", e.getClass().getSimpleName())
                .register(meterRegistry)
                .increment();
    }

    private void countSent(String eventTag) {
        Counter.builder(METRIC_SENT).tag("event", eventTag).register(meterRegistry).increment();
    }
}
