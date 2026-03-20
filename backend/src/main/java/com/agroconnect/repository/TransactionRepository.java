package com.agroconnect.repository;

import com.agroconnect.model.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByRequestId(Long requestId);

    @Query("""
            SELECT t FROM Transaction t
            WHERE t.request.client.id = :userId
            OR t.proposal.provider.user.id = :userId
            ORDER BY t.createdAt DESC
            """)
    Page<Transaction> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId, Pageable pageable);
}
