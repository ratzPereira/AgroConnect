package com.agroconnect.repository;

import com.agroconnect.model.MachineExpense;
import com.agroconnect.model.enums.ExpenseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MachineExpenseRepository extends JpaRepository<MachineExpense, Long> {

    List<MachineExpense> findByMachineIdOrderByIncurredAtDesc(Long machineId);

    Optional<MachineExpense> findByIdAndMachineId(Long id, Long machineId);

    @Query("""
            SELECT COALESCE(SUM(e.amount), 0) FROM MachineExpense e
            WHERE e.machine.id = :machineId
              AND e.incurredAt >= :from AND e.incurredAt <= :to
            """)
    BigDecimal sumAmountInPeriod(@Param("machineId") Long machineId,
                                 @Param("from") LocalDate from,
                                 @Param("to") LocalDate to);

    @Query("""
            SELECT COALESCE(SUM(e.amount), 0) FROM MachineExpense e
            WHERE e.machine.id = :machineId
              AND e.category = :category
              AND e.incurredAt >= :from AND e.incurredAt <= :to
            """)
    BigDecimal sumAmountByCategoryInPeriod(@Param("machineId") Long machineId,
                                           @Param("category") ExpenseCategory category,
                                           @Param("from") LocalDate from,
                                           @Param("to") LocalDate to);

    @Query("""
            SELECT COALESCE(SUM(e.amount), 0) FROM MachineExpense e
            WHERE e.machine.provider.id = :providerId
              AND e.incurredAt >= :from AND e.incurredAt <= :to
            """)
    BigDecimal sumAmountByProviderInPeriod(@Param("providerId") Long providerId,
                                           @Param("from") LocalDate from,
                                           @Param("to") LocalDate to);
}
