package com.agroconnect.unit;

import com.agroconnect.dto.response.NotificationResponse;
import com.agroconnect.model.User;
import com.agroconnect.repository.UserRepository;
import com.agroconnect.service.NotificationPublisher;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationPublisherTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationPublisher publisher;

    private NotificationResponse createNotification() {
        return new NotificationResponse(
                1L, "NEW_PROPOSAL", "Nova proposta",
                "Recebeu uma nova proposta", null, false, Instant.now(), null);
    }

    @Test
    void sendToUser_givenValidUser_shouldSendWebSocketMessage() {
        User user = User.builder().id(1L).email("test@email.pt").build();
        NotificationResponse notification = createNotification();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        publisher.sendToUser(1L, notification);

        verify(messagingTemplate).convertAndSendToUser(
                eq("test@email.pt"), eq("/queue/notifications"), eq(notification));
    }

    @Test
    void sendToUser_givenNonExistentUser_shouldNotSendMessage() {
        NotificationResponse notification = createNotification();

        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        publisher.sendToUser(999L, notification);

        verify(messagingTemplate, never()).convertAndSendToUser(any(), any(), any());
    }

    @Test
    void sendToUser_givenMessagingException_shouldNotThrow() {
        User user = User.builder().id(1L).email("test@email.pt").build();
        NotificationResponse notification = createNotification();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        doThrow(new RuntimeException("WebSocket error"))
                .when(messagingTemplate).convertAndSendToUser(any(), any(), any());

        // Should not throw — WebSocket delivery is best-effort
        publisher.sendToUser(1L, notification);
    }
}
