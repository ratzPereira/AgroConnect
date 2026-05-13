package com.agroconnect.repository;

import com.agroconnect.model.ExecutionResourceUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public interface ExecutionResourceUsageRepository extends JpaRepository<ExecutionResourceUsage, Long> {

    List<ExecutionResourceUsage> findByExecutionIdOrderByCreatedAtAsc(Long executionId);

    @Query("""
            SELECT COALESCE(SUM(u.totalCost), 0) FROM ExecutionResourceUsage u
            WHERE u.execution.id = :executionId
            """)
    BigDecimal sumTotalCostByExecutionId(@Param("executionId") Long executionId);

    @Query("""
            SELECT COALESCE(SUM(u.totalCost), 0) FROM ExecutionResourceUsage u
            WHERE u.execution.proposal.provider.id = :providerId
              AND u.execution.completedAt IS NOT NULL
              AND u.execution.completedAt >= :from AND u.execution.completedAt < :to
            """)
    BigDecimal sumMaterialsCostByProviderInPeriod(@Param("providerId") Long providerId,
                                                  @Param("from") Instant from,
                                                  @Param("to") Instant to);
}
