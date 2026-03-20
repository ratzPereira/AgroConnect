package com.agroconnect.repository;

import com.agroconnect.model.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByRequestId(Long requestId);

    @Query("""
            SELECT t FROM Transaction t
            WHERE t.request.client.id = :userId
            OR t.proposal.provider.user.id = :userId
            ORDER BY t.createdAt DESC
            """)
    Page<Transaction> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId, Pageable pageable);

    @Query("""
            SELECT t FROM Transaction t
            WHERE t.proposal.provider.user.id = :userId
            ORDER BY t.createdAt DESC
            """)
    Page<Transaction> findByProviderUserIdOrderByCreatedAtDesc(@Param("userId") Long userId, Pageable pageable);

    @Query("""
            SELECT COALESCE(SUM(t.providerPayout), 0)
            FROM Transaction t
            WHERE t.proposal.provider.id = :providerId
            AND t.status = com.agroconnect.model.enums.TransactionStatus.RELEASED
            """)
    BigDecimal sumReleasedPayoutByProviderId(@Param("providerId") Long providerId);

    @Query("""
            SELECT COALESCE(SUM(t.amount), 0)
            FROM Transaction t
            WHERE t.proposal.provider.id = :providerId
            AND t.status = com.agroconnect.model.enums.TransactionStatus.HELD
            """)
    BigDecimal sumPendingAmountByProviderId(@Param("providerId") Long providerId);

    @Query("""
            SELECT COALESCE(SUM(t.providerPayout), 0)
            FROM Transaction t
            WHERE t.proposal.provider.id = :providerId
            AND t.status = com.agroconnect.model.enums.TransactionStatus.RELEASED
            AND t.releasedAt >= :from
            AND t.releasedAt < :to
            """)
    BigDecimal sumReleasedPayoutByProviderIdAndPeriod(@Param("providerId") Long providerId,
                                                      @Param("from") Instant from,
                                                      @Param("to") Instant to);

    @Query("""
            SELECT COALESCE(SUM(t.commissionAmount), 0)
            FROM Transaction t
            WHERE t.proposal.provider.id = :providerId
            AND t.status = com.agroconnect.model.enums.TransactionStatus.RELEASED
            """)
    BigDecimal sumCommissionsByProviderId(@Param("providerId") Long providerId);

    @Query("""
            SELECT COALESCE(SUM(t.amount), 0)
            FROM Transaction t
            WHERE t.proposal.provider.id = :providerId
            AND t.status = com.agroconnect.model.enums.TransactionStatus.RELEASED
            """)
    BigDecimal sumReleasedAmountByProviderId(@Param("providerId") Long providerId);

    @Query("""
            SELECT COUNT(t) FROM Transaction t
            WHERE t.proposal.provider.id = :providerId
            AND t.status = com.agroconnect.model.enums.TransactionStatus.RELEASED
            """)
    long countReleasedByProviderId(@Param("providerId") Long providerId);

    long countByStatus(com.agroconnect.model.enums.TransactionStatus status);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t")
    BigDecimal sumTotalAmount();

    @Query("SELECT COALESCE(SUM(t.commissionAmount), 0) FROM Transaction t")
    BigDecimal sumTotalCommissions();
}
