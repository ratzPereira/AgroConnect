package com.agroconnect.repository;

import com.agroconnect.model.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByRequestId(Long requestId);

    boolean existsByRequestIdAndAuthorId(Long requestId, Long authorId);

    int countByRequestId(Long requestId);

    Page<Review> findByTargetIdOrderByCreatedAtDesc(Long targetId, Pageable pageable);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.target.id = :targetId")
    Double findAverageRatingByTargetId(@Param("targetId") Long targetId);

    int countByTargetId(Long targetId);
}
