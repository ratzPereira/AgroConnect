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

    @Query("""
            SELECT se FROM ServiceExecution se
            JOIN se.proposal p
            JOIN p.provider pp
            WHERE pp.id = :providerId
            AND se.createdAt >= :from
            AND se.createdAt <= :to
            """)
    List<ServiceExecution> findByProviderAndDateRange(@Param("providerId") Long providerId,
                                                      @Param("from") Instant from,
                                                      @Param("to") Instant to);

    @Query("""
            SELECT se FROM ServiceExecution se
            JOIN FETCH se.proposal p
            JOIN FETCH p.request sr
            JOIN FETCH sr.category
            WHERE p.provider.id = :providerId
            AND sr.status IN (
                com.agroconnect.model.enums.RequestStatus.AWARDED,
                com.agroconnect.model.enums.RequestStatus.IN_PROGRESS,
                com.agroconnect.model.enums.RequestStatus.AWAITING_CONFIRMATION
            )
            ORDER BY sr.updatedAt DESC
            """)
    List<ServiceExecution> findActiveByProviderId(@Param("providerId") Long providerId);
}
