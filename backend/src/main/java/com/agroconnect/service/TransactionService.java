package com.agroconnect.service;

import com.agroconnect.dto.response.TransactionResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.mapper.TransactionMapper;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.Transaction;
import com.agroconnect.model.enums.TransactionStatus;
import com.agroconnect.repository.TransactionRepository;
import com.stripe.model.Refund;
import com.stripe.model.Transfer;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TransactionService {

    private static final Logger log = LoggerFactory.getLogger(TransactionService.class);

    private final TransactionRepository transactionRepository;
    private final AuditService auditService;
    private final StripeService stripeService;
    private final NotificationService notificationService;

    public Page<TransactionResponse> listMyTransactions(Long userId, Pageable pageable) {
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(TransactionMapper::toResponse);
    }

    public TransactionResponse getById(Long id, Long userId) {
        Transaction tx = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada."));

        boolean isClient = tx.getRequest().getClient().getId().equals(userId);
        boolean isProvider = tx.getProposal().getProvider().getUser().getId().equals(userId);

        if (!isClient && !isProvider) {
            throw new ForbiddenException("Não tem permissão para ver esta transação.");
        }

        return TransactionMapper.toResponse(tx);
    }

    /**
     * Releases held funds to the provider via a Stripe Transfer. Called when the
     * client confirms completion or AutoConfirmJob auto-confirms after the SLA window.
     * Idempotent on the Stripe side via the transactionId-keyed idempotency token.
     */
    @Transactional
    public void release(Long requestId) {
        Transaction tx = transactionRepository.findByRequestId(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada para o pedido."));

        if (tx.getStatus() != TransactionStatus.HELD) {
            throw new InvalidStateException("Só é possível liberar transações com estado HELD.");
        }

        ProviderProfile provider = tx.getProposal().getProvider();
        if (provider.getStripeAccountId() == null || !provider.isStripePayoutsEnabled()) {
            throw new InvalidStateException(
                    "O prestador não tem conta Stripe ativa para receber pagamentos.");
        }

        Transfer transfer = stripeService.createTransfer(
                tx.getId(),
                provider.getStripeAccountId(),
                tx.getProviderPayout(),
                tx.getStripeChargeId()
        );

        tx.setStatus(TransactionStatus.RELEASED);
        tx.setReleasedAt(Instant.now());
        tx.setStripeTransferId(transfer.getId());
        transactionRepository.save(tx);

        log.info("Transaction {} released for request {} (transfer={}, payout={} EUR)",
                tx.getId(), requestId, transfer.getId(), tx.getProviderPayout());

        auditService.log(null, "RELEASED", "Transaction", tx.getId(),
                Map.of("oldStatus", "HELD"),
                Map.of("newStatus", "RELEASED",
                        "amount", tx.getProviderPayout(),
                        "transferId", transfer.getId()));

        notificationService.create(
                provider.getUser().getId(),
                "PAYMENT_RELEASED",
                "Pagamento libertado",
                "O pagamento de " + tx.getProviderPayout() + "€ para o pedido \""
                        + tx.getRequest().getTitle() + "\" foi transferido para a sua conta Stripe.",
                "{\"requestId\":" + tx.getRequest().getId() + "}"
        );
    }

    /**
     * Refunds a held charge back to the client via a Stripe Refund. Called when
     * the request is cancelled after payment, or when a dispute is resolved in
     * favour of the client. Idempotent on the Stripe side via the transactionId
     * idempotency token.
     */
    @Transactional
    public void refund(Long requestId) {
        Transaction tx = transactionRepository.findByRequestId(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada para o pedido."));

        if (tx.getStatus() != TransactionStatus.HELD) {
            throw new InvalidStateException("Só é possível reembolsar transações com estado HELD.");
        }

        if (tx.getStripePaymentIntentId() == null) {
            throw new InvalidStateException(
                    "Transação não tem PaymentIntent associado — impossível reembolsar.");
        }

        Refund refund = stripeService.createRefund(
                tx.getId(),
                tx.getStripePaymentIntentId(),
                tx.getAmount(),
                "Cancelamento ou disputa do pedido " + requestId
        );

        tx.setStatus(TransactionStatus.REFUNDED);
        tx.setRefundedAt(Instant.now());
        transactionRepository.save(tx);

        log.info("Transaction {} refunded for request {} (refund={}, amount={} EUR)",
                tx.getId(), requestId, refund.getId(), tx.getAmount());

        auditService.log(null, "REFUNDED", "Transaction", tx.getId(),
                Map.of("oldStatus", "HELD"),
                Map.of("newStatus", "REFUNDED",
                        "amount", tx.getAmount(),
                        "refundId", refund.getId()));

        notificationService.create(
                tx.getRequest().getClient().getId(),
                "PAYMENT_REFUNDED",
                "Pagamento reembolsado",
                "O pagamento de " + tx.getAmount() + "€ para o pedido \""
                        + tx.getRequest().getTitle() + "\" foi reembolsado para o seu método de pagamento.",
                "{\"requestId\":" + tx.getRequest().getId() + "}"
        );
    }
}
