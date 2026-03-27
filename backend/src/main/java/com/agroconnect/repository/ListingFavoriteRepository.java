package com.agroconnect.repository;

import com.agroconnect.model.ListingFavorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ListingFavoriteRepository extends JpaRepository<ListingFavorite, Long> {

    boolean existsByListingIdAndUserId(Long listingId, Long userId);

    Optional<ListingFavorite> findByListingIdAndUserId(Long listingId, Long userId);

    Page<ListingFavorite> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByListingId(Long listingId);
}
