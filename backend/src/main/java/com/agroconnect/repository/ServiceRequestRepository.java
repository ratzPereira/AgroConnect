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
            AND ST_DWithin(sr.location::geography, :point::geography, :radiusMeters)
            ORDER BY sr.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM service_requests sr
            WHERE sr.status IN ('PUBLISHED', 'WITH_PROPOSALS')
            AND ST_DWithin(sr.location::geography, :point::geography, :radiusMeters)
            """,
            nativeQuery = true)
    Page<ServiceRequest> findAvailableForProvider(@Param("point") Point point,
                                                   @Param("radiusMeters") double radiusMeters,
                                                   Pageable pageable);

    @Query("SELECT sr FROM ServiceRequest sr WHERE sr.status = 'PUBLISHED' AND sr.expiresAt < :now")
    List<ServiceRequest> findExpiredPublished(@Param("now") Instant now);
}
