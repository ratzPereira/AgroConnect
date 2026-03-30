package com.agroconnect.unit;

import com.agroconnect.dto.response.NotificationResponse;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.model.Notification;
import com.agroconnect.model.User;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.repository.NotificationRepository;
import com.agroconnect.repository.UserRepository;
import com.agroconnect.service.NotificationPublisher;
import com.agroconnect.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationPublisher notificationPublisher;

    private NotificationService service;

    private User user;

    @BeforeEach
    void setUp() {
        service = new NotificationService(notificationRepository, userRepository, notificationPublisher);
        user = UserFixture.aClientUser().build();
    }

    // --- create ---

    @Test
    void create_shouldSaveNotification() {
        Notification saved = Notification.builder()
                .id(1L)
                .user(user)
                .type("NEW_PROPOSAL")
                .title("Nova proposta")
                .body("Recebeu uma nova proposta.")
                .data(null)
                .createdAt(Instant.now())
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(notificationRepository.save(any(Notification.class))).thenReturn(saved);

        service.create(1L, "NEW_PROPOSAL", "Nova proposta", "Recebeu uma nova proposta.");

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification captured = captor.getValue();
        assertEquals("NEW_PROPOSAL", captured.getType());
        assertEquals("Nova proposta", captured.getTitle());
        assertEquals("Recebeu uma nova proposta.", captured.getBody());
    }

    @Test
    void create_shouldCallPublisher() {
        Notification saved = Notification.builder()
                .id(1L)
                .user(user)
                .type("NEW_PROPOSAL")
                .title("Nova proposta")
                .body("Recebeu uma nova proposta.")
                .createdAt(Instant.now())
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(notificationRepository.save(any(Notification.class))).thenReturn(saved);

        service.create(1L, "NEW_PROPOSAL", "Nova proposta", "Recebeu uma nova proposta.");

        verify(notificationPublisher).sendToUser(eq(1L), any(NotificationResponse.class));
    }

    @Test
    void create_withData_shouldSaveNotificationWithData() {
        String data = "{\"requestId\":42}";
        Notification saved = Notification.builder()
                .id(1L)
                .user(user)
                .type("NEW_REVIEW")
                .title("Nova avaliação")
                .body("Recebeu uma avaliação.")
                .data(data)
                .createdAt(Instant.now())
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(notificationRepository.save(any(Notification.class))).thenReturn(saved);

        service.create(1L, "NEW_REVIEW", "Nova avaliação", "Recebeu uma avaliação.", data);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertEquals(data, captor.getValue().getData());
    }

    @Test
    void create_givenNonExistentUser_shouldThrowNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.create(99L, "TEST", "Test", "Test body"));
    }

    // --- listByUser ---

    @Test
    void listByUser_shouldReturnPagedNotifications() {
        Notification n1 = Notification.builder()
                .id(1L).user(user).type("TYPE1").title("T1").body("B1")
                .read(false).createdAt(Instant.now()).build();
        Notification n2 = Notification.builder()
                .id(2L).user(user).type("TYPE2").title("T2").body("B2")
                .read(true).createdAt(Instant.now()).build();

        Pageable pageable = PageRequest.of(0, 10);
        Page<Notification> page = new PageImpl<>(List.of(n1, n2), pageable, 2);

        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L, pageable)).thenReturn(page);

        Page<NotificationResponse> result = service.listByUser(1L, pageable);

        assertNotNull(result);
        assertEquals(2, result.getTotalElements());
    }

    // --- getUnreadCount ---

    @Test
    void getUnreadCount_shouldReturnCorrectCount() {
        when(notificationRepository.countByUserIdAndReadFalse(1L)).thenReturn(5L);

        long count = service.getUnreadCount(1L);

        assertEquals(5L, count);
    }

    @Test
    void getUnreadCount_givenNoUnread_shouldReturnZero() {
        when(notificationRepository.countByUserIdAndReadFalse(1L)).thenReturn(0L);

        long count = service.getUnreadCount(1L);

        assertEquals(0L, count);
    }

    // --- markAsRead ---

    @Test
    void markAsRead_givenOwner_shouldMarkRead() {
        Notification notification = Notification.builder()
                .id(1L).user(user).type("TEST").title("T").body("B")
                .read(false).createdAt(Instant.now()).build();

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));

        service.markAsRead(1L, 1L);

        assertTrue(notification.isRead());
        verify(notificationRepository).save(notification);
    }

    @Test
    void markAsRead_givenNonOwner_shouldThrowNotFound() {
        User otherUser = UserFixture.aProviderUser().build();
        Notification notification = Notification.builder()
                .id(1L).user(otherUser).type("TEST").title("T").body("B")
                .read(false).createdAt(Instant.now()).build();

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));

        // The service throws ResourceNotFoundException for non-owner (hides existence)
        assertThrows(ResourceNotFoundException.class, () -> service.markAsRead(1L, 1L));
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void markAsRead_givenNonExistentNotification_shouldThrowNotFound() {
        when(notificationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.markAsRead(99L, 1L));
    }

    // --- markAllAsRead ---

    @Test
    void markAllAsRead_shouldMarkAllUserNotificationsRead() {
        service.markAllAsRead(1L);

        verify(notificationRepository).markAllAsReadByUserId(1L);
    }
}
