package com.agroconnect.repository;

import com.agroconnect.model.RequestPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RequestPhotoRepository extends JpaRepository<RequestPhoto, Long> {

    List<RequestPhoto> findByRequestIdOrderBySortOrderAsc(Long requestId);

    int countByRequestId(Long requestId);
}
