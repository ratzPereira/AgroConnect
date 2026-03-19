package com.agroconnect.repository;

import com.agroconnect.model.ProviderProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.locationtech.jts.geom.Point;

import java.util.List;
import java.util.Optional;

public interface ProviderProfileRepository extends JpaRepository<ProviderProfile, Long> {

    Optional<ProviderProfile> findByUserId(Long userId);

    @Query(value = """
            SELECT pp.* FROM provider_profiles pp
            WHERE pp.location IS NOT NULL
            AND ST_DWithin(pp.location::geography, :point::geography, :radiusMeters)
            """, nativeQuery = true)
    List<ProviderProfile> findWithinRadius(@Param("point") Point point,
                                           @Param("radiusMeters") double radiusMeters);
}
