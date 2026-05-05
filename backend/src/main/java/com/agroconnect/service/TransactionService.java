package com.agroconnect.service;

import com.agroconnect.dto.response.TransactionResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.mapper.TransactionMapper;
import com.agroconnect.model.Transaction;
import com.agroconnect.model.enums.TransactionStatus;
import com.agroconnect.repository.TransactionRepository;
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

    @Transactional
    public void release(Long requestId) {
        Transaction tx = transactionRepository.findByRequestId(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada para o pedido."));

        if (tx.getStatus() != TransactionStatus.HELD) {
            throw new InvalidStateException("Só é possível liberar transações com estado HELD.");
        }

        tx.setStatus(TransactionStatus.RELEASED);
        tx.setReleasedAt(Instant.now());
        transactionRepository.save(tx);

        log.info("Transaction {} released for request {}", tx.getId(), requestId);
        auditService.log(null, "RELEASED", "Transaction", tx.getId(),
                Map.of("oldStatus", "HELD"), Map.of("newStatus", "RELEASED", "amount", tx.getProviderPayout()));
    }

    @Transactional
    public void refund(Long requestId) {
        Transaction tx = transactionRepository.findByRequestId(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada para o pedido."));

        if (tx.getStatus() != TransactionStatus.HELD) {
            throw new InvalidStateException("Só é possível reembolsar transações com estado HELD.");
        }

        tx.setStatus(TransactionStatus.REFUNDED);
        tx.setRefundedAt(Instant.now());
        transactionRepository.save(tx);

        log.info("Transaction {} refunded for request {}", tx.getId(), requestId);
        auditService.log(null, "REFUNDED", "Transaction", tx.getId(),
                Map.of("oldStatus", "HELD"), Map.of("newStatus", "REFUNDED", "amount", tx.getAmount()));
    }
}
