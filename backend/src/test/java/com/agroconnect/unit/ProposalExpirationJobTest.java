package com.agroconnect.unit;

import com.agroconnect.fixture.ProposalFixture;
import com.agroconnect.model.Proposal;
import com.agroconnect.model.enums.ProposalStatus;
import com.agroconnect.repository.ProposalRepository;
import com.agroconnect.scheduler.ProposalExpirationJob;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProposalExpirationJobTest {

    @Mock
    private ProposalRepository proposalRepository;

    private ProposalExpirationJob proposalExpirationJob;

    @BeforeEach
    void setUp() {
        proposalExpirationJob = new ProposalExpirationJob(proposalRepository);
    }

    @Test
    void expirePendingProposals_givenExpiredProposals_shouldSetWithdrawn() {
        Proposal proposal = ProposalFixture.aProposal()
                .id(1L)
                .status(ProposalStatus.PENDING)
                .build();

        when(proposalRepository.findExpiredPending(any(Instant.class)))
                .thenReturn(List.of(proposal));

        proposalExpirationJob.expirePendingProposals();

        assertEquals(ProposalStatus.WITHDRAWN, proposal.getStatus());
        verify(proposalRepository).save(proposal);
    }

    @Test
    void expirePendingProposals_givenNoExpired_shouldDoNothing() {
        when(proposalRepository.findExpiredPending(any(Instant.class)))
                .thenReturn(Collections.emptyList());

        proposalExpirationJob.expirePendingProposals();

        verify(proposalRepository, never()).save(any(Proposal.class));
    }

    @Test
    void expirePendingProposals_givenMultiple_shouldWithdrawAll() {
        Proposal proposal1 = ProposalFixture.aProposal()
                .id(1L)
                .status(ProposalStatus.PENDING)
                .build();
        Proposal proposal2 = ProposalFixture.aProposal()
                .id(2L)
                .status(ProposalStatus.PENDING)
                .build();

        when(proposalRepository.findExpiredPending(any(Instant.class)))
                .thenReturn(List.of(proposal1, proposal2));

        proposalExpirationJob.expirePendingProposals();

        assertEquals(ProposalStatus.WITHDRAWN, proposal1.getStatus());
        assertEquals(ProposalStatus.WITHDRAWN, proposal2.getStatus());
        verify(proposalRepository, times(2)).save(any(Proposal.class));
    }

    @Test
    void expirePendingProposals_shouldPassCurrentInstantToRepository() {
        when(proposalRepository.findExpiredPending(any(Instant.class)))
                .thenReturn(Collections.emptyList());

        Instant before = Instant.now();
        proposalExpirationJob.expirePendingProposals();
        Instant after = Instant.now();

        ArgumentCaptor<Instant> instantCaptor = ArgumentCaptor.forClass(Instant.class);
        verify(proposalRepository).findExpiredPending(instantCaptor.capture());

        Instant captured = instantCaptor.getValue();
        assertTrue(!captured.isBefore(before) && !captured.isAfter(after),
                "Instant passed to repository should be between before and after the method call");
    }
}
