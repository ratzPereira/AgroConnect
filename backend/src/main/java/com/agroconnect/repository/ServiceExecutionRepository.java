package com.agroconnect.repository;

import com.agroconnect.model.ServiceExecution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ServiceExecutionRepository extends JpaRepository<ServiceExecution, Long> {

    Optional<ServiceExecution> findByProposalId(Long proposalId);

    @Query("""
            SELECT se FROM ServiceExecution se
            JOIN se.proposal p
            JOIN p.request r
            WHERE se.completedAt IS NOT NULL
            AND se.completedAt < :cutoff
            AND r.status = com.agroconnect.model.enums.RequestStatus.AWAITING_CONFIRMATION
            """)
    List<ServiceExecution> findCompletedAwaitingConfirmationBefore(@Param("cutoff") Instant cutoff);
}
