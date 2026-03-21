package com.agroconnect.repository;

import com.agroconnect.model.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    Page<ChatMessage> findByRequestIdOrderBySentAtAsc(Long requestId, Pageable pageable);

    long countByRequestIdAndSentAtAfter(Long requestId, Instant after);

    List<ChatMessage> findBySenderId(Long senderId);
}
