package com.agroconnect.repository;

import com.agroconnect.model.Listing;
import com.agroconnect.model.enums.ListingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface ListingRepository extends JpaRepository<Listing, Long> {

    Page<Listing> findByStatusOrderByCreatedAtDesc(ListingStatus status, Pageable pageable);

    Page<Listing> findBySellerIdOrderByCreatedAtDesc(Long sellerId, Pageable pageable);

    Page<Listing> findBySellerIdAndStatusOrderByCreatedAtDesc(Long sellerId, ListingStatus status, Pageable pageable);

    @Query(value = """
            SELECT l.* FROM listings l
            WHERE l.status = 'ACTIVE'
            AND (:category IS NULL OR l.category = CAST(:category AS VARCHAR))
            AND (:island IS NULL OR l.island = CAST(:island AS VARCHAR))
            AND (:query IS NULL OR l.title ILIKE CONCAT('%%', CAST(:query AS TEXT), '%%')
                 OR l.description ILIKE CONCAT('%%', CAST(:query AS TEXT), '%%'))
            AND (:minPrice IS NULL OR l.price >= CAST(:minPrice AS DECIMAL))
            AND (:maxPrice IS NULL OR l.price <= CAST(:maxPrice AS DECIMAL))
            AND (:lat IS NULL OR :lng IS NULL OR :radiusMeters IS NULL
                 OR ST_DWithin(CAST(l.location AS geography),
                               CAST(ST_SetSRID(ST_MakePoint(CAST(:lng AS DOUBLE PRECISION), CAST(:lat AS DOUBLE PRECISION)), 4326) AS geography),
                               CAST(:radiusMeters AS DOUBLE PRECISION)))
            ORDER BY l.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM listings l
            WHERE l.status = 'ACTIVE'
            AND (:category IS NULL OR l.category = CAST(:category AS VARCHAR))
            AND (:island IS NULL OR l.island = CAST(:island AS VARCHAR))
            AND (:query IS NULL OR l.title ILIKE CONCAT('%%', CAST(:query AS TEXT), '%%')
                 OR l.description ILIKE CONCAT('%%', CAST(:query AS TEXT), '%%'))
            AND (:minPrice IS NULL OR l.price >= CAST(:minPrice AS DECIMAL))
            AND (:maxPrice IS NULL OR l.price <= CAST(:maxPrice AS DECIMAL))
            AND (:lat IS NULL OR :lng IS NULL OR :radiusMeters IS NULL
                 OR ST_DWithin(CAST(l.location AS geography),
                               CAST(ST_SetSRID(ST_MakePoint(CAST(:lng AS DOUBLE PRECISION), CAST(:lat AS DOUBLE PRECISION)), 4326) AS geography),
                               CAST(:radiusMeters AS DOUBLE PRECISION)))
            """,
            nativeQuery = true)
    Page<Listing> searchActive(
            @Param("category") String category,
            @Param("island") String island,
            @Param("query") String query,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice,
            @Param("lat") Double lat,
            @Param("lng") Double lng,
            @Param("radiusMeters") Double radiusMeters,
            Pageable pageable);

    @Query("SELECT l FROM Listing l WHERE l.status = com.agroconnect.model.enums.ListingStatus.ACTIVE AND l.expiresAt < :now")
    List<Listing> findExpiredActive(@Param("now") Instant now);

    long countBySellerIdAndStatus(Long sellerId, ListingStatus status);

    long countByStatus(ListingStatus status);

    Page<Listing> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
