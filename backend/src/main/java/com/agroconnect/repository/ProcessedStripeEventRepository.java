package com.agroconnect.repository;

import com.agroconnect.model.ProcessedStripeEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface ProcessedStripeEventRepository extends JpaRepository<ProcessedStripeEvent, String> {

    /**
     * Atomically claims a Stripe event ID. Returns 1 if this is the first time
     * we've seen the event (caller should process it), 0 if a previous delivery
     * already inserted this row (caller should short-circuit and return 200).
     */
    @Modifying
    @Query(value = """
            INSERT INTO processed_stripe_events (event_id, event_type, received_at)
            VALUES (:eventId, :eventType, NOW())
            ON CONFLICT (event_id) DO NOTHING
            """, nativeQuery = true)
    int claimEvent(@Param("eventId") String eventId, @Param("eventType") String eventType);

    @Modifying
    @Query("UPDATE ProcessedStripeEvent e SET e.processedAt = :processedAt WHERE e.eventId = :eventId")
    int markProcessed(@Param("eventId") String eventId, @Param("processedAt") Instant processedAt);

    @Modifying
    @Query("UPDATE ProcessedStripeEvent e SET e.errorMessage = :error WHERE e.eventId = :eventId")
    int recordError(@Param("eventId") String eventId, @Param("error") String error);
}
