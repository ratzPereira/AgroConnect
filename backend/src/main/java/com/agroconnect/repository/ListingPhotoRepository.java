package com.agroconnect.repository;

import com.agroconnect.model.ListingPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ListingPhotoRepository extends JpaRepository<ListingPhoto, Long> {

    List<ListingPhoto> findByListingIdOrderBySortOrderAsc(Long listingId);

    int countByListingId(Long listingId);

    void deleteByListingIdAndId(Long listingId, Long id);
}
