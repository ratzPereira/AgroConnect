package com.agroconnect.repository;

import com.agroconnect.model.ListingConversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ListingConversationRepository extends JpaRepository<ListingConversation, Long> {

    Optional<ListingConversation> findByListingIdAndBuyerId(Long listingId, Long buyerId);

    @Query("SELECT c FROM ListingConversation c JOIN c.listing l WHERE l.seller.id = :sellerId ORDER BY c.lastMessageAt DESC NULLS LAST")
    Page<ListingConversation> findSellerInbox(@Param("sellerId") Long sellerId, Pageable pageable);

    Page<ListingConversation> findByBuyerIdOrderByLastMessageAtDesc(Long buyerId, Pageable pageable);

    @Query("SELECT c FROM ListingConversation c JOIN c.listing l WHERE l.seller.id = :userId OR c.buyer.id = :userId ORDER BY c.lastMessageAt DESC NULLS LAST")
    Page<ListingConversation> findByParticipant(@Param("userId") Long userId, Pageable pageable);

    List<ListingConversation> findByListingId(Long listingId);
}
