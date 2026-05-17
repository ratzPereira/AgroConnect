package com.agroconnect.service;

import com.agroconnect.exception.StripeIntegrationException;
import com.agroconnect.model.Transaction;
import com.agroconnect.model.enums.TransactionStatus;
import com.agroconnect.repository.ProcessedStripeEventRepository;
import com.agroconnect.repository.TransactionRepository;
import com.stripe.model.Account;
import com.stripe.model.Charge;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import com.stripe.model.Transfer;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

/**
 * Dispatches Stripe webhook events to the appropriate domain handlers.
 * <p>
 * Idempotency is enforced by inserting the event ID into {@code processed_stripe_events}
 * within the same transaction as the dispatch. If the row exists already, the
 * delivery is a duplicate retry and we short-circuit with a no-op. If the
 * dispatch throws, the row insert is rolled back, returning a 500 to Stripe so
 * it retries the delivery.
 */
@Service
@RequiredArgsConstructor
public class StripeWebhookService {

    private static final Logger log = LoggerFactory.getLogger(StripeWebhookService.class);

    private final ProcessedStripeEventRepository processedEventRepository;
    private final TransactionRepository transactionRepository;
    private final StripeAccountService stripeAccountService;
    private final ProposalService proposalService;
    private final NotificationService notificationService;

    @Transactional
    public void handle(Event event) {
        int claimed = processedEventRepository.claimEvent(event.getId(), event.getType());
        if (claimed == 0) {
            log.info("Stripe event {} ({}) already processed — skipping duplicate delivery",
                    event.getId(), event.getType());
            return;
        }

        log.info("Processing Stripe event {} ({})", event.getId(), event.getType());
        dispatch(event);
        processedEventRepository.markProcessed(event.getId(), Instant.now());
    }

    private void dispatch(Event event) {
        switch (event.getType()) {
            case "account.updated" -> handleAccountUpdated(event);
            case "payment_intent.succeeded" -> handlePaymentIntentSucceeded(event);
            case "payment_intent.payment_failed" -> handlePaymentIntentFailed(event);
            case "payment_intent.canceled" -> handlePaymentIntentCanceled(event);
            case "charge.refunded" -> handleChargeRefunded(event);
            case "transfer.created" -> handleTransferCreated(event);
            case "transfer.failed" -> handleTransferFailed(event);
            default -> log.debug("Ignoring Stripe event type {}", event.getType());
        }
    }

    private void handleAccountUpdated(Event event) {
        Account account = (Account) deserialize(event);
        stripeAccountService.applyAccountUpdated(account);
    }

    private void handlePaymentIntentSucceeded(Event event) {
        PaymentIntent intent = (PaymentIntent) deserialize(event);
        // Lock row before status check — without this, a duplicate webhook delivery
        // racing with another transition could both pass the PENDING guard.
        Optional<Transaction> opt = transactionRepository.findByStripePaymentIntentIdForUpdate(intent.getId());
        if (opt.isEmpty()) {
            log.warn("payment_intent.succeeded for unknown PaymentIntent {} — ignoring", intent.getId());
            return;
        }

        Transaction tx = opt.get();
        if (tx.getStatus() != TransactionStatus.PENDING) {
            log.info("Transaction {} already in {} — payment_intent.succeeded is a no-op",
                    tx.getId(), tx.getStatus());
            return;
        }

        tx.setStatus(TransactionStatus.HELD);
        tx.setHeldAt(Instant.now());
        // Capture the charge so we can later pass it as source_transaction on the Transfer.
        tx.setStripeChargeId(intent.getLatestCharge());
        transactionRepository.save(tx);

        proposalService.completeAcceptanceAfterPayment(tx.getId());

        notificationService.create(
                tx.getRequest().getClient().getId(),
                "PAYMENT_HELD",
                "Pagamento confirmado",
                "O seu pagamento para o pedido \"" + tx.getRequest().getTitle() + "\" foi confirmado e está em escrow.",
                "{\"requestId\":" + tx.getRequest().getId() + "}"
        );

        log.info("Transaction {} moved PENDING → HELD via PaymentIntent {}", tx.getId(), intent.getId());
    }

    private void handlePaymentIntentFailed(Event event) {
        PaymentIntent intent = (PaymentIntent) deserialize(event);
        String failureMessage = intent.getLastPaymentError() != null
                ? intent.getLastPaymentError().getMessage()
                : "Pagamento recusado pelo emissor.";

        transactionRepository.findByStripePaymentIntentId(intent.getId()).ifPresentOrElse(
                tx -> {
                    notificationService.create(
                            tx.getRequest().getClient().getId(),
                            "PAYMENT_FAILED",
                            "Pagamento falhado",
                            "O pagamento para o pedido \"" + tx.getRequest().getTitle() + "\" falhou: " + failureMessage,
                            "{\"requestId\":" + tx.getRequest().getId() + "}"
                    );
                    log.warn("PaymentIntent {} failed for transaction {}: {}",
                            intent.getId(), tx.getId(), failureMessage);
                },
                () -> log.warn("payment_intent.payment_failed for unknown PaymentIntent {}: {}",
                        intent.getId(), failureMessage)
        );
    }

    private void handlePaymentIntentCanceled(Event event) {
        PaymentIntent intent = (PaymentIntent) deserialize(event);
        log.info("PaymentIntent {} canceled — status sync only", intent.getId());
    }

    private void handleChargeRefunded(Event event) {
        Charge charge = (Charge) deserialize(event);
        String paymentIntentId = charge.getPaymentIntent();
        if (paymentIntentId == null) {
            log.warn("charge.refunded with no associated PaymentIntent — ignoring");
            return;
        }

        log.info("charge.refunded confirmed for PaymentIntent {} (refund total: {} {})",
                paymentIntentId, charge.getAmountRefunded(), charge.getCurrency());
        // Refund state is set when we initiate the refund (TransactionService.refund).
        // This handler exists so we record the event and ack Stripe.
    }

    private void handleTransferCreated(Event event) {
        Transfer transfer = (Transfer) deserialize(event);
        String transactionId = transfer.getMetadata().get("transactionId");
        if (transactionId == null) {
            log.warn("transfer.created without transactionId metadata — ignoring (transfer={})", transfer.getId());
            return;
        }

        transactionRepository.findById(Long.valueOf(transactionId)).ifPresentOrElse(
                tx -> {
                    if (tx.getStripeTransferId() == null) {
                        tx.setStripeTransferId(transfer.getId());
                        transactionRepository.save(tx);
                    }
                    log.info("transfer.created {} confirmed for transaction {}", transfer.getId(), tx.getId());
                },
                () -> log.warn("transfer.created for unknown transaction {} (transfer={})",
                        transactionId, transfer.getId())
        );
    }

    private void handleTransferFailed(Event event) {
        Transfer transfer = (Transfer) deserialize(event);
        log.error("Stripe transfer {} FAILED — destination={}, amount={} {}",
                transfer.getId(), transfer.getDestination(),
                transfer.getAmount(), transfer.getCurrency());
        // Operations alert: surface this to admins via notification or audit log.
        // Implemented in Task #25 (TransactionService transfer flow).
    }

    private static StripeObject deserialize(Event event) {
        EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
        Optional<StripeObject> object = deserializer.getObject();
        if (object.isPresent()) {
            return object.get();
        }
        try {
            return deserializer.deserializeUnsafe();
        } catch (Exception e) {
            throw new StripeIntegrationException(
                    "Falha ao deserializar evento Stripe " + event.getId() + " (" + event.getType() + ")", e);
        }
    }
}
