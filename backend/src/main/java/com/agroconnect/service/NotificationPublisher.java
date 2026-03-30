package com.agroconnect.service;

import com.agroconnect.dto.response.NotificationResponse;
import com.agroconnect.model.User;
import com.agroconnect.repository.UserRepository;
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
    private final UserRepository userRepository;

    public void sendToUser(Long userId, NotificationResponse notification) {
        try {
            // Spring STOMP resolves user destinations by Principal.getName(), which is the email
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                log.warn("Cannot send WebSocket notification: user {} not found", userId);
                return;
            }
            messagingTemplate.convertAndSendToUser(
                    user.getEmail(),
                    "/queue/notifications",
                    notification
            );
            log.debug("WebSocket notification sent to user {} ({}): {}", userId, user.getEmail(), notification.type());
        } catch (Exception e) {
            // WebSocket delivery is best-effort; don't fail the operation
            log.warn("Failed to send WebSocket notification to user {}: {}", userId, e.getMessage());
        }
    }
}
