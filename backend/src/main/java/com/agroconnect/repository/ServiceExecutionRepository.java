package com.agroconnect.repository;

import com.agroconnect.model.ServiceExecution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ServiceExecutionRepository extends JpaRepository<ServiceExecution, Long> {

    @Query("SELECT e FROM ServiceExecution e " +
           "LEFT JOIN FETCH e.proposal p " +
           "LEFT JOIN FETCH p.request " +
           "LEFT JOIN FETCH e.assignments a " +
           "LEFT JOIN FETCH a.teamMember " +
           "LEFT JOIN FETCH a.machine " +
           "LEFT JOIN FETCH e.photos " +
           "WHERE p.id = :proposalId")
    Optional<ServiceExecution> findByProposalId(@Param("proposalId") Long proposalId);

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

    @Query("""
            SELECT se FROM ServiceExecution se
            JOIN FETCH se.proposal p
            JOIN FETCH p.request sr
            JOIN FETCH sr.category
            LEFT JOIN FETCH se.assignments a
            LEFT JOIN FETCH a.teamMember
            LEFT JOIN FETCH a.machine
            WHERE p.provider.id = :providerId
            AND se.scheduledDate IS NOT NULL
            AND se.scheduledEndDate >= :from
            AND se.scheduledDate <= :to
            AND sr.status IN (
                com.agroconnect.model.enums.RequestStatus.AWARDED,
                com.agroconnect.model.enums.RequestStatus.IN_PROGRESS,
                com.agroconnect.model.enums.RequestStatus.AWAITING_CONFIRMATION,
                com.agroconnect.model.enums.RequestStatus.COMPLETED,
                com.agroconnect.model.enums.RequestStatus.RATED
            )
            ORDER BY se.scheduledDate ASC
            """)
    List<ServiceExecution> findByProviderAndScheduledRange(
            @Param("providerId") Long providerId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}
