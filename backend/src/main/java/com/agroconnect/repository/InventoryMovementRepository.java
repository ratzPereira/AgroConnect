package com.agroconnect.repository;

import com.agroconnect.model.InventoryMovement;
import com.agroconnect.model.enums.MovementType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {

    Page<InventoryMovement> findByItemIdOrderByCreatedAtDesc(Long itemId, Pageable pageable);

    List<InventoryMovement> findByExecutionId(Long executionId);

    @Query("""
            SELECT COALESCE(SUM(m.quantityDelta), 0) FROM InventoryMovement m
            WHERE m.item.id = :itemId
              AND m.movementType IN (com.agroconnect.model.enums.MovementType.PURCHASE,
                                     com.agroconnect.model.enums.MovementType.INITIAL,
                                     com.agroconnect.model.enums.MovementType.ADJUSTMENT_IN)
              AND m.createdAt >= :from AND m.createdAt < :to
            """)
    BigDecimal sumIncomingQty(@Param("itemId") Long itemId,
                              @Param("from") Instant from,
                              @Param("to") Instant to);

    @Query("""
            SELECT COALESCE(SUM(-m.quantityDelta), 0) FROM InventoryMovement m
            WHERE m.item.id = :itemId
              AND m.movementType IN (com.agroconnect.model.enums.MovementType.CONSUMPTION,
                                     com.agroconnect.model.enums.MovementType.ADJUSTMENT_OUT)
              AND m.createdAt >= :from AND m.createdAt < :to
            """)
    BigDecimal sumOutgoingQty(@Param("itemId") Long itemId,
                              @Param("from") Instant from,
                              @Param("to") Instant to);

    @Query("""
            SELECT COALESCE(SUM(m.quantityDelta * m.unitCost), 0) FROM InventoryMovement m
            WHERE m.item.id = :itemId
              AND m.movementType IN (com.agroconnect.model.enums.MovementType.PURCHASE,
                                     com.agroconnect.model.enums.MovementType.INITIAL,
                                     com.agroconnect.model.enums.MovementType.ADJUSTMENT_IN)
              AND m.unitCost IS NOT NULL
              AND m.createdAt >= :from AND m.createdAt < :to
            """)
    BigDecimal sumPurchaseValue(@Param("itemId") Long itemId,
                                @Param("from") Instant from,
                                @Param("to") Instant to);

    @Query("""
            SELECT COUNT(m) FROM InventoryMovement m
            WHERE m.item.id = :itemId
              AND m.movementType = :type
              AND m.createdAt >= :from AND m.createdAt < :to
            """)
    long countByType(@Param("itemId") Long itemId,
                     @Param("type") MovementType type,
                     @Param("from") Instant from,
                     @Param("to") Instant to);
}
