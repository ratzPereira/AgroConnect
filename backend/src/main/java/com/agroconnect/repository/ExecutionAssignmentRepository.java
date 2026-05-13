package com.agroconnect.repository;

import com.agroconnect.model.ExecutionAssignment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public interface ExecutionAssignmentRepository extends JpaRepository<ExecutionAssignment, Long> {

    List<ExecutionAssignment> findByExecutionId(Long executionId);

    boolean existsByExecutionIdAndTeamMemberId(Long executionId, Long teamMemberId);

    @Query("""
            SELECT COALESCE(SUM(a.machineHours), 0) FROM ExecutionAssignment a
            WHERE a.machine.id = :machineId
              AND a.execution.completedAt IS NOT NULL
              AND a.execution.completedAt >= :from AND a.execution.completedAt < :to
            """)
    BigDecimal sumMachineHoursInPeriod(@Param("machineId") Long machineId,
                                       @Param("from") Instant from,
                                       @Param("to") Instant to);

    @Query("""
            SELECT COUNT(DISTINCT a.execution.id) FROM ExecutionAssignment a
            WHERE a.machine.id = :machineId
              AND a.execution.completedAt IS NOT NULL
              AND a.execution.completedAt >= :from AND a.execution.completedAt < :to
            """)
    long countDistinctExecutionsForMachine(@Param("machineId") Long machineId,
                                           @Param("from") Instant from,
                                           @Param("to") Instant to);

    @Query("""
            SELECT COALESCE(SUM(p.price), 0) FROM ExecutionAssignment a
            JOIN a.execution e
            JOIN e.proposal p
            WHERE a.machine.id = :machineId
              AND e.completedAt IS NOT NULL
              AND e.completedAt >= :from AND e.completedAt < :to
              AND a.id IN (
                SELECT MIN(a2.id) FROM ExecutionAssignment a2
                WHERE a2.execution.id = a.execution.id
                  AND a2.machine.id = :machineId
              )
            """)
    BigDecimal sumRevenueAttributedToMachine(@Param("machineId") Long machineId,
                                             @Param("from") Instant from,
                                             @Param("to") Instant to);

    @Query("""
            SELECT DISTINCT a.execution.id FROM ExecutionAssignment a
            WHERE a.machine.id = :machineId
              AND a.execution.completedAt IS NOT NULL
              AND a.execution.completedAt >= :from AND a.execution.completedAt < :to
            ORDER BY a.execution.id DESC
            """)
    Page<Long> findExecutionIdsForMachine(@Param("machineId") Long machineId,
                                          @Param("from") Instant from,
                                          @Param("to") Instant to,
                                          Pageable pageable);

    // ───────── Operator (team member) analytics ─────────

    @Query("""
            SELECT COUNT(DISTINCT a.execution.id) FROM ExecutionAssignment a
            WHERE a.teamMember.id = :operatorId
              AND a.execution.completedAt IS NOT NULL
              AND a.execution.completedAt >= :from AND a.execution.completedAt < :to
            """)
    long countDistinctExecutionsForOperator(@Param("operatorId") Long operatorId,
                                            @Param("from") Instant from,
                                            @Param("to") Instant to);

    @Query("""
            SELECT COALESCE(SUM(a.hoursWorked), 0) FROM ExecutionAssignment a
            WHERE a.teamMember.id = :operatorId
              AND a.execution.completedAt IS NOT NULL
              AND a.execution.completedAt >= :from AND a.execution.completedAt < :to
            """)
    BigDecimal sumHoursWorkedForOperator(@Param("operatorId") Long operatorId,
                                         @Param("from") Instant from,
                                         @Param("to") Instant to);

    @Query("""
            SELECT COALESCE(SUM(a.hoursWorked * a.hourlyRateSnapshot), 0) FROM ExecutionAssignment a
            WHERE a.teamMember.id = :operatorId
              AND a.hoursWorked IS NOT NULL
              AND a.hourlyRateSnapshot IS NOT NULL
              AND a.execution.completedAt IS NOT NULL
              AND a.execution.completedAt >= :from AND a.execution.completedAt < :to
            """)
    BigDecimal sumLaborCostForOperator(@Param("operatorId") Long operatorId,
                                       @Param("from") Instant from,
                                       @Param("to") Instant to);

    @Query("""
            SELECT DISTINCT a.execution.id FROM ExecutionAssignment a
            WHERE a.teamMember.id = :operatorId
              AND a.execution.completedAt IS NOT NULL
              AND a.execution.completedAt >= :from AND a.execution.completedAt < :to
            ORDER BY a.execution.id DESC
            """)
    Page<Long> findExecutionIdsForOperator(@Param("operatorId") Long operatorId,
                                           @Param("from") Instant from,
                                           @Param("to") Instant to,
                                           Pageable pageable);

    @Query("""
            SELECT a FROM ExecutionAssignment a
            WHERE a.teamMember.id = :operatorId
              AND a.execution.completedAt IS NOT NULL
              AND a.execution.completedAt >= :from AND a.execution.completedAt < :to
            """)
    List<ExecutionAssignment> findAllForOperatorInPeriod(@Param("operatorId") Long operatorId,
                                                         @Param("from") Instant from,
                                                         @Param("to") Instant to);

    @Query("""
            SELECT COUNT(DISTINCT a.teamMember.id) FROM ExecutionAssignment a
            WHERE a.execution.id = :executionId
            """)
    long countOperatorsForExecution(@Param("executionId") Long executionId);

    // ───────── Provider-wide finance aggregation ─────────

    @Query("""
            SELECT COALESCE(SUM(a.hoursWorked * a.hourlyRateSnapshot), 0) FROM ExecutionAssignment a
            WHERE a.execution.proposal.provider.id = :providerId
              AND a.hoursWorked IS NOT NULL
              AND a.hourlyRateSnapshot IS NOT NULL
              AND a.execution.completedAt IS NOT NULL
              AND a.execution.completedAt >= :from AND a.execution.completedAt < :to
            """)
    BigDecimal sumLaborCostByProviderInPeriod(@Param("providerId") Long providerId,
                                              @Param("from") Instant from,
                                              @Param("to") Instant to);
}
