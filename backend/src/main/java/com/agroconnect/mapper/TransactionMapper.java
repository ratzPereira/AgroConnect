package com.agroconnect.mapper;

import com.agroconnect.dto.response.TransactionResponse;
import com.agroconnect.model.Transaction;

public final class TransactionMapper {

    private TransactionMapper() {}

    public static TransactionResponse toResponse(Transaction tx) {
        return new TransactionResponse(
                tx.getId(),
                tx.getRequest().getId(),
                tx.getProposal().getId(),
                tx.getAmount(),
                tx.getCommissionRate(),
                tx.getCommissionAmount(),
                tx.getProviderPayout(),
                tx.getStatus(),
                tx.getHeldAt(),
                tx.getReleasedAt(),
                tx.getRefundedAt(),
                tx.getCreatedAt()
        );
    }
}
