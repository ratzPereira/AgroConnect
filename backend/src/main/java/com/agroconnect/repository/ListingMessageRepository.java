package com.agroconnect.repository;

import com.agroconnect.model.ListingMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface ListingMessageRepository extends JpaRepository<ListingMessage, Long> {

    Page<ListingMessage> findByConversationIdOrderBySentAtAsc(Long conversationId, Pageable pageable);

    @Query("SELECT COUNT(m) FROM ListingMessage m WHERE m.conversation.id = :convId AND m.sender.id != :userId AND m.readAt IS NULL")
    long countUnread(@Param("convId") Long convId, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE ListingMessage m SET m.readAt = :now WHERE m.conversation.id = :convId AND m.sender.id != :userId AND m.readAt IS NULL")
    int markAsRead(@Param("convId") Long convId, @Param("userId") Long userId, @Param("now") Instant now);

    @Query(value = "SELECT * FROM listing_messages WHERE conversation_id = :convId ORDER BY sent_at DESC LIMIT 1", nativeQuery = true)
    Optional<ListingMessage> findLastByConversationId(@Param("convId") Long convId);
}
