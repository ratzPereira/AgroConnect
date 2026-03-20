package com.agroconnect.service;

import com.agroconnect.dto.response.NotificationResponse;
import com.agroconnect.mapper.NotificationMapper;
import com.agroconnect.model.Notification;
import com.agroconnect.model.User;
import com.agroconnect.repository.NotificationRepository;
import com.agroconnect.repository.UserRepository;
import com.agroconnect.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationPublisher notificationPublisher;

    @Transactional
    public void create(Long userId, String type, String title, String body) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilizador não encontrado."));

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .body(body)
                .build();

        notification = notificationRepository.save(notification);

        // Send real-time notification via WebSocket
        NotificationResponse response = NotificationMapper.toResponse(notification);
        notificationPublisher.sendToUser(userId, response);

        log.debug("Notification created for user {}: {}", userId, type);
    }

    public Page<NotificationResponse> listByUser(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(NotificationMapper::toResponse);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
        log.debug("All notifications marked as read for user {}", userId);
    }
}
