package com.agroconnect.mapper;

import com.agroconnect.dto.response.NotificationResponse;
import com.agroconnect.model.Notification;

public final class NotificationMapper {

    private NotificationMapper() {}

    public static NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getBody(),
                notification.getData(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
