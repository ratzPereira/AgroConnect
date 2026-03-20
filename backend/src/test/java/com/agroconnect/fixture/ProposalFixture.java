package com.agroconnect.fixture;

import com.agroconnect.model.Proposal;
import com.agroconnect.model.Transaction;
import com.agroconnect.model.enums.PricingModel;
import com.agroconnect.model.enums.ProposalStatus;
import com.agroconnect.model.enums.TransactionStatus;

import java.math.BigDecimal;
import java.time.Instant;

public final class ProposalFixture {

    private ProposalFixture() {}

    public static Proposal.ProposalBuilder aProposal() {
        return Proposal.builder()
                .id(1L)
                .status(ProposalStatus.PENDING)
                .price(new BigDecimal("250.00"))
                .pricingModel(PricingModel.FIXED)
                .description("Realizo a lavoura com trator de 120cv com grade de discos")
                .includesText("Combustível, operador, transporte do equipamento")
                .excludesText("Trabalhos de drenagem")
                .createdAt(Instant.now())
                .updatedAt(Instant.now());
    }

    public static Transaction.TransactionBuilder aTransaction() {
        return Transaction.builder()
                .id(1L)
                .amount(new BigDecimal("250.00"))
                .commissionRate(new BigDecimal("0.1200"))
                .commissionAmount(new BigDecimal("30.00"))
                .providerPayout(new BigDecimal("220.00"))
                .status(TransactionStatus.HELD)
                .heldAt(Instant.now())
                .createdAt(Instant.now());
    }
}
