package com.agroconnect.repository;

import com.agroconnect.model.InventoryItem;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    List<InventoryItem> findByProviderId(Long providerId);

    Optional<InventoryItem> findByIdAndProviderId(Long id, Long providerId);

    /**
     * Acquires a row-level write lock on the item.
     * Use within @Transactional write methods that adjust stock or WAC to
     * serialize concurrent purchases/consumptions against the same item.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM InventoryItem i WHERE i.id = :id AND i.provider.id = :providerId")
    Optional<InventoryItem> findByIdAndProviderIdForUpdate(@Param("id") Long id,
                                                           @Param("providerId") Long providerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM InventoryItem i WHERE i.id = :id")
    Optional<InventoryItem> findByIdForUpdate(@Param("id") Long id);

    boolean existsByProviderIdAndProductName(Long providerId, String productName);

    @Query("""
            SELECT i FROM InventoryItem i
            WHERE i.provider.id = :providerId
            AND i.minStockAlert IS NOT NULL
            AND i.quantity <= i.minStockAlert
            """)
    List<InventoryItem> findLowStockByProviderId(@Param("providerId") Long providerId);
}
