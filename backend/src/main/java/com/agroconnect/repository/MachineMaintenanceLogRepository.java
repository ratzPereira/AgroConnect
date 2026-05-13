package com.agroconnect.repository;

import com.agroconnect.model.MachineMaintenanceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MachineMaintenanceLogRepository extends JpaRepository<MachineMaintenanceLog, Long> {

    List<MachineMaintenanceLog> findByMachineIdOrderByPerformedAtDesc(Long machineId);

    Optional<MachineMaintenanceLog> findByIdAndMachineId(Long id, Long machineId);

    @Query("""
            SELECT COALESCE(SUM(m.cost), 0) FROM MachineMaintenanceLog m
            WHERE m.machine.id = :machineId
              AND m.cost IS NOT NULL
              AND m.performedAt >= :from AND m.performedAt <= :to
            """)
    BigDecimal sumCostInPeriod(@Param("machineId") Long machineId,
                               @Param("from") LocalDate from,
                               @Param("to") LocalDate to);

    @Query("""
            SELECT COUNT(m) FROM MachineMaintenanceLog m
            WHERE m.machine.id = :machineId
              AND m.performedAt >= :from AND m.performedAt <= :to
            """)
    long countInPeriod(@Param("machineId") Long machineId,
                       @Param("from") LocalDate from,
                       @Param("to") LocalDate to);

    @Query("""
            SELECT COALESCE(SUM(m.cost), 0) FROM MachineMaintenanceLog m
            WHERE m.machine.provider.id = :providerId
              AND m.cost IS NOT NULL
              AND m.performedAt >= :from AND m.performedAt <= :to
            """)
    BigDecimal sumCostByProviderInPeriod(@Param("providerId") Long providerId,
                                         @Param("from") LocalDate from,
                                         @Param("to") LocalDate to);

    @Query("""
            SELECT m FROM MachineMaintenanceLog m
            JOIN FETCH m.machine ma
            WHERE ma.provider.id = :providerId
              AND m.nextDueAt IS NOT NULL
              AND m.nextDueAt >= :from
              AND m.nextDueAt <= :to
            ORDER BY m.nextDueAt ASC
            """)
    List<MachineMaintenanceLog> findUpcomingByProviderInRange(@Param("providerId") Long providerId,
                                                              @Param("from") LocalDate from,
                                                              @Param("to") LocalDate to);
}
