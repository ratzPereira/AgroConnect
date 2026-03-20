package com.agroconnect.service;

import com.agroconnect.dto.response.NotificationResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NotificationPublisher {

    private static final Logger log = LoggerFactory.getLogger(NotificationPublisher.class);

    private final SimpMessagingTemplate messagingTemplate;

    public void sendToUser(Long userId, NotificationResponse notification) {
        try {
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/notifications",
                    notification
            );
            log.debug("WebSocket notification sent to user {}: {}", userId, notification.type());
        } catch (Exception e) {
            // WebSocket delivery is best-effort; don't fail the operation
            log.warn("Failed to send WebSocket notification to user {}: {}", userId, e.getMessage());
        }
    }
}
