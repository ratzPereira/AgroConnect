package com.agroconnect.repository;

import com.agroconnect.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    List<InventoryItem> findByProviderId(Long providerId);

    Optional<InventoryItem> findByIdAndProviderId(Long id, Long providerId);

    boolean existsByProviderIdAndProductName(Long providerId, String productName);

    @Query("""
            SELECT i FROM InventoryItem i
            WHERE i.provider.id = :providerId
            AND i.minStockAlert IS NOT NULL
            AND i.quantity <= i.minStockAlert
            """)
    List<InventoryItem> findLowStockByProviderId(@Param("providerId") Long providerId);
}
