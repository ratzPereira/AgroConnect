package com.agroconnect.service;

import com.agroconnect.config.StripeProperties;
import com.agroconnect.exception.StripeIntegrationException;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Account;
import com.stripe.model.AccountLink;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.model.Transfer;
import com.stripe.net.RequestOptions;
import com.stripe.net.Webhook;
import com.stripe.param.AccountCreateParams;
import com.stripe.param.AccountLinkCreateParams;
import com.stripe.param.PaymentIntentCancelParams;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.TransferCreateParams;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class StripeService {

    private static final Logger log = LoggerFactory.getLogger(StripeService.class);
    private static final String CURRENCY_EUR = "eur";

    private final StripeProperties properties;

    /**
     * Creates an Express connected account for a provider. Idempotent on (providerId)
     * so retries don't create duplicates.
     */
    public Account createExpressAccount(Long providerId, String email, String country) {
        AccountCreateParams params = AccountCreateParams.builder()
                .setType(AccountCreateParams.Type.EXPRESS)
                .setCountry(country)
                .setEmail(email)
                .setCapabilities(AccountCreateParams.Capabilities.builder()
                        .setCardPayments(AccountCreateParams.Capabilities.CardPayments.builder()
                                .setRequested(true)
                                .build())
                        .setTransfers(AccountCreateParams.Capabilities.Transfers.builder()
                                .setRequested(true)
                                .build())
                        .build())
                .setBusinessType(AccountCreateParams.BusinessType.INDIVIDUAL)
                .putMetadata("providerId", String.valueOf(providerId))
                .build();

        try {
            Account account = Account.create(params, idempotency("provider-" + providerId));
            log.info("Created Stripe Express account {} for provider {}", account.getId(), providerId);
            return account;
        } catch (StripeException e) {
            throw wrap("Falha ao criar conta Stripe", e);
        }
    }

    public AccountLink createOnboardingLink(String accountId) {
        AccountLinkCreateParams params = AccountLinkCreateParams.builder()
                .setAccount(accountId)
                .setRefreshUrl(properties.onboardingRefreshUrl())
                .setReturnUrl(properties.onboardingReturnUrl())
                .setType(AccountLinkCreateParams.Type.ACCOUNT_ONBOARDING)
                .build();

        try {
            return AccountLink.create(params);
        } catch (StripeException e) {
            throw wrap("Falha ao gerar link de onboarding", e);
        }
    }

    public Account retrieveAccount(String accountId) {
        try {
            return Account.retrieve(accountId);
        } catch (StripeException e) {
            throw wrap("Falha ao consultar conta Stripe", e);
        }
    }

    /**
     * Creates a PaymentIntent on the platform balance. No transfer_data — funds stay
     * on platform until we explicitly call createTransfer (separate charges and
     * transfers pattern, gives us platform-controlled escrow timing).
     */
    public PaymentIntent createPaymentIntent(Long transactionId,
                                             BigDecimal amountEur,
                                             String customerEmail,
                                             Long requestId,
                                             Long proposalId) {
        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(toMinorUnits(amountEur))
                .setCurrency(CURRENCY_EUR)
                .setReceiptEmail(customerEmail)
                .setTransferGroup("txn-" + transactionId)
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .build())
                .putMetadata("transactionId", String.valueOf(transactionId))
                .putMetadata("requestId", String.valueOf(requestId))
                .putMetadata("proposalId", String.valueOf(proposalId))
                .build();

        try {
            PaymentIntent intent = PaymentIntent.create(params, idempotency("pi-txn-" + transactionId));
            log.info("Created PaymentIntent {} for transaction {} ({} EUR)",
                    intent.getId(), transactionId, amountEur);
            return intent;
        } catch (StripeException e) {
            throw wrap("Falha ao criar PaymentIntent", e);
        }
    }

    public PaymentIntent cancelPaymentIntent(String paymentIntentId) {
        try {
            PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);
            return intent.cancel(PaymentIntentCancelParams.builder().build());
        } catch (StripeException e) {
            throw wrap("Falha ao cancelar PaymentIntent", e);
        }
    }

    /**
     * Transfers funds from platform balance to the connected account. Source
     * transaction is the original charge captured by the PaymentIntent — Stripe
     * uses this to enforce that we don't transfer more than was charged.
     */
    public Transfer createTransfer(Long transactionId,
                                   String connectedAccountId,
                                   BigDecimal payoutEur,
                                   String sourceChargeId) {
        TransferCreateParams.Builder paramsBuilder = TransferCreateParams.builder()
                .setAmount(toMinorUnits(payoutEur))
                .setCurrency(CURRENCY_EUR)
                .setDestination(connectedAccountId)
                .setTransferGroup("txn-" + transactionId)
                .putMetadata("transactionId", String.valueOf(transactionId));

        if (sourceChargeId != null) {
            paramsBuilder.setSourceTransaction(sourceChargeId);
        }

        try {
            Transfer transfer = Transfer.create(paramsBuilder.build(),
                    idempotency("transfer-txn-" + transactionId));
            log.info("Created Transfer {} for transaction {} to {} ({} EUR)",
                    transfer.getId(), transactionId, connectedAccountId, payoutEur);
            return transfer;
        } catch (StripeException e) {
            throw wrap("Falha ao transferir para o provider", e);
        }
    }

    public Refund createRefund(Long transactionId, String paymentIntentId, BigDecimal amountEur, String reason) {
        RefundCreateParams.Builder paramsBuilder = RefundCreateParams.builder()
                .setPaymentIntent(paymentIntentId)
                .setAmount(toMinorUnits(amountEur))
                .putMetadata("transactionId", String.valueOf(transactionId));

        if (reason != null && !reason.isBlank()) {
            paramsBuilder.putMetadata("reason", reason);
        }

        try {
            Refund refund = Refund.create(paramsBuilder.build(),
                    idempotency("refund-txn-" + transactionId));
            log.info("Created Refund {} for transaction {} ({} EUR)",
                    refund.getId(), transactionId, amountEur);
            return refund;
        } catch (StripeException e) {
            throw wrap("Falha ao reembolsar pagamento", e);
        }
    }

    public Event verifyWebhookSignature(String payload, String sigHeader) {
        try {
            return Webhook.constructEvent(payload, sigHeader, properties.webhookSecret());
        } catch (SignatureVerificationException e) {
            log.warn("Stripe webhook signature verification failed");
            throw new StripeIntegrationException("Assinatura de webhook inválida", e);
        }
    }

    private static long toMinorUnits(BigDecimal amountEur) {
        return amountEur.setScale(2, RoundingMode.HALF_UP)
                .movePointRight(2)
                .longValueExact();
    }

    private static RequestOptions idempotency(String key) {
        return RequestOptions.builder().setIdempotencyKey(key).build();
    }

    private static StripeIntegrationException wrap(String message, StripeException e) {
        log.error("{}: code={}, message={}", message, e.getCode(), e.getMessage());
        return new StripeIntegrationException(message + ": " + e.getMessage(), e);
    }
}
