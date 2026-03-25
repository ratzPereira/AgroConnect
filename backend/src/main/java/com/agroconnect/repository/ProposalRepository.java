package com.agroconnect.repository;

import com.agroconnect.model.Proposal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface ProposalRepository extends JpaRepository<Proposal, Long> {

    List<Proposal> findByRequestId(Long requestId);

    Page<Proposal> findByProviderIdOrderByCreatedAtDesc(Long providerId, Pageable pageable);

    boolean existsByRequestIdAndProviderId(Long requestId, Long providerId);

    @Modifying
    @Query("UPDATE Proposal p SET p.status = 'REJECTED', p.updatedAt = CURRENT_TIMESTAMP WHERE p.request.id = :requestId AND p.id <> :acceptedId AND p.status = 'PENDING'")
    void rejectAllPendingExcept(@Param("requestId") Long requestId, @Param("acceptedId") Long acceptedId);

    @Query("SELECT p FROM Proposal p WHERE p.status = 'PENDING' AND p.validUntil IS NOT NULL AND p.validUntil < :now")
    List<Proposal> findExpiredPending(@Param("now") Instant now);

    long countByProviderUserId(Long userId);

    @Query("""
            SELECT COUNT(p) FROM Proposal p
            WHERE p.request.client.id = :clientId
            AND p.request.status NOT IN (
                com.agroconnect.model.enums.RequestStatus.RATED,
                com.agroconnect.model.enums.RequestStatus.EXPIRED,
                com.agroconnect.model.enums.RequestStatus.CANCELLED,
                com.agroconnect.model.enums.RequestStatus.DRAFT
            )
            """)
    long countActiveProposalsByClientId(@Param("clientId") Long clientId);
}
