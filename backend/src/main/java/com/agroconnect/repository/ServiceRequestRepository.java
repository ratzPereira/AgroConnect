package com.agroconnect.repository;

import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.enums.RequestStatus;
import org.locationtech.jts.geom.Point;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {

    Page<ServiceRequest> findByClientIdOrderByCreatedAtDesc(Long clientId, Pageable pageable);

    Page<ServiceRequest> findByClientIdAndStatusOrderByCreatedAtDesc(Long clientId, RequestStatus status, Pageable pageable);

    @Query(value = """
            SELECT sr.* FROM service_requests sr
            WHERE sr.status IN ('PUBLISHED', 'WITH_PROPOSALS')
            AND ST_DWithin(CAST(sr.location AS geography), CAST(:point AS geography), :radiusMeters)
            ORDER BY sr.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM service_requests sr
            WHERE sr.status IN ('PUBLISHED', 'WITH_PROPOSALS')
            AND ST_DWithin(CAST(sr.location AS geography), CAST(:point AS geography), :radiusMeters)
            """,
            nativeQuery = true)
    Page<ServiceRequest> findAvailableForProvider(@Param("point") Point point,
                                                   @Param("radiusMeters") double radiusMeters,
                                                   Pageable pageable);

    @Query("SELECT sr FROM ServiceRequest sr WHERE sr.status IN ('PUBLISHED', 'WITH_PROPOSALS') AND sr.expiresAt < :now")
    List<ServiceRequest> findExpiredPublished(@Param("now") Instant now);

    @Query("SELECT sr FROM ServiceRequest sr WHERE sr.status = com.agroconnect.model.enums.RequestStatus.COMPLETED AND sr.updatedAt < :cutoff")
    List<ServiceRequest> findCompletedBeforeDate(@Param("cutoff") Instant cutoff);

    long countByStatus(RequestStatus status);

    long countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(Instant start, Instant end);

    @Query("""
            SELECT COUNT(sr) FROM ServiceRequest sr
            WHERE sr.status NOT IN (
                com.agroconnect.model.enums.RequestStatus.RATED,
                com.agroconnect.model.enums.RequestStatus.EXPIRED,
                com.agroconnect.model.enums.RequestStatus.CANCELLED
            )
            """)
    long countActiveRequests();

    Page<ServiceRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status, Pageable pageable);

    long countByClientId(Long clientId);

    List<ServiceRequest> findByClientId(Long clientId);

    @Query(value = """
            SELECT sr.* FROM service_requests sr
            WHERE sr.status NOT IN ('RATED', 'EXPIRED', 'CANCELLED', 'DRAFT')
            AND ST_DWithin(CAST(sr.location AS geography), CAST(:point AS geography), :radiusMeters)
            """,
            nativeQuery = true)
    List<ServiceRequest> findPinsForProvider(@Param("point") Point point,
                                             @Param("radiusMeters") double radiusMeters);

    List<ServiceRequest> findByClientIdAndStatusNotIn(Long clientId, List<RequestStatus> statuses);

    @Query(value = """
            SELECT sr.* FROM service_requests sr
            WHERE sr.status IN ('PUBLISHED', 'WITH_PROPOSALS')
            AND ST_DWithin(CAST(sr.location AS geography), CAST(:point AS geography), :radiusMeters)
            AND (:search IS NULL OR sr.title ILIKE CONCAT('%%', CAST(:search AS text), '%%') OR sr.description ILIKE CONCAT('%%', CAST(:search AS text), '%%'))
            AND (:categoryId IS NULL OR sr.category_id = CAST(:categoryId AS bigint))
            AND (:urgency IS NULL OR sr.urgency = CAST(:urgency AS text))
            AND (:island IS NULL OR sr.island = CAST(:island AS text))
            ORDER BY sr.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM service_requests sr
            WHERE sr.status IN ('PUBLISHED', 'WITH_PROPOSALS')
            AND ST_DWithin(CAST(sr.location AS geography), CAST(:point AS geography), :radiusMeters)
            AND (:search IS NULL OR sr.title ILIKE CONCAT('%%', CAST(:search AS text), '%%') OR sr.description ILIKE CONCAT('%%', CAST(:search AS text), '%%'))
            AND (:categoryId IS NULL OR sr.category_id = CAST(:categoryId AS bigint))
            AND (:urgency IS NULL OR sr.urgency = CAST(:urgency AS text))
            AND (:island IS NULL OR sr.island = CAST(:island AS text))
            """,
            nativeQuery = true)
    Page<ServiceRequest> findAvailableForProviderFiltered(
            @Param("point") Point point,
            @Param("radiusMeters") double radiusMeters,
            @Param("search") String search,
            @Param("categoryId") Long categoryId,
            @Param("urgency") String urgency,
            @Param("island") String island,
            Pageable pageable);
}
