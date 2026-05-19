package com.agroconnect.fixture;

import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.Transaction;
import com.agroconnect.model.enums.TransactionStatus;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.TransactionRepository;
import com.agroconnect.service.ProposalService;
import com.agroconnect.service.StripeService;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.model.Transfer;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Shared helpers for integration tests that exercise the proposal acceptance + Stripe flow.
 * The accept endpoint now defers the marketplace cascade (proposal → ACCEPTED, request →
 * AWARDED, etc.) until {@code payment_intent.succeeded} fires. ITs that need the cascade
 * to advance must invoke {@link #simulateWebhookCascade} after calling /accept.
 */
public final class StripeTestHelper {

    private StripeTestHelper() {}

    public static void markProviderStripeReady(ProviderProfileRepository repository, Long userId) {
        ProviderProfile profile = repository.findByUserId(userId).orElseThrow();
        profile.setStripeAccountId("acct_test_it_" + userId);
        profile.setStripeChargesEnabled(true);
        profile.setStripePayoutsEnabled(true);
        profile.setStripeDetailsSubmitted(true);
        repository.save(profile);
    }

    public static PaymentIntent stubCreatePaymentIntent(StripeService stripeService,
                                                        String paymentIntentId,
                                                        String clientSecret) {
        PaymentIntent intent = mock(PaymentIntent.class);
        lenient().when(intent.getId()).thenReturn(paymentIntentId);
        lenient().when(intent.getClientSecret()).thenReturn(clientSecret);
        lenient().when(intent.getLatestCharge()).thenReturn("ch_test_" + paymentIntentId);
        // Mirror Stripe's lifecycle: a freshly-created intent is in "requires_payment_method"
        // until the client confirms it. ProposalService.accept treats this status as
        // resumable (so re-accept on the same proposal returns the same intent).
        lenient().when(intent.getStatus()).thenReturn("requires_payment_method");
        when(stripeService.createPaymentIntent(anyLong(), any(), anyString(), anyLong(), anyLong()))
                .thenReturn(intent);
        lenient().when(stripeService.retrievePaymentIntent(paymentIntentId)).thenReturn(intent);
        return intent;
    }

    public static Transfer stubCreateTransfer(StripeService stripeService, String transferId) {
        Transfer transfer = mock(Transfer.class);
        lenient().when(transfer.getId()).thenReturn(transferId);
        when(stripeService.createTransfer(anyLong(), anyString(), any(), anyString()))
                .thenReturn(transfer);
        return transfer;
    }

    public static Refund stubCreateRefund(StripeService stripeService, String refundId) {
        Refund refund = mock(Refund.class);
        lenient().when(refund.getId()).thenReturn(refundId);
        when(stripeService.createRefund(anyLong(), anyString(), any(), anyString()))
                .thenReturn(refund);
        return refund;
    }

    public static Long simulateWebhookCascade(TransactionRepository transactionRepository,
                                              ProposalService proposalService,
                                              Long requestId) {
        Transaction tx = transactionRepository.findByRequestId(requestId).orElseThrow();
        tx.setStatus(TransactionStatus.HELD);
        tx.setHeldAt(Instant.now());
        // Mirror what payment_intent.succeeded does — we'll need this charge ID later
        // when release() creates the Transfer (source_transaction).
        tx.setStripeChargeId("ch_test_" + tx.getStripePaymentIntentId());
        transactionRepository.save(tx);
        proposalService.completeAcceptanceAfterPayment(tx.getId());
        return tx.getId();
    }
}
