package com.agroconnect.scheduler;

import com.agroconnect.model.Proposal;
import com.agroconnect.model.enums.ProposalStatus;
import com.agroconnect.repository.ProposalRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ProposalExpirationJob {

    private static final Logger log = LoggerFactory.getLogger(ProposalExpirationJob.class);

    private final ProposalRepository proposalRepository;

    @Scheduled(cron = "0 30 * * * *")
    @Transactional
    public void expirePendingProposals() {
        List<Proposal> expired = proposalRepository.findExpiredPending(Instant.now());

        for (Proposal proposal : expired) {
            proposal.setStatus(ProposalStatus.WITHDRAWN);
            proposalRepository.save(proposal);
            log.info("Proposal expired and withdrawn: {}", proposal.getId());
        }

        if (!expired.isEmpty()) {
            log.info("Withdrawn {} expired proposals", expired.size());
        }
    }
}
