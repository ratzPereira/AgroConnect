package com.agroconnect.mapper;

import com.agroconnect.dto.response.NotificationResponse;
import com.agroconnect.model.Notification;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class NotificationMapper {

    private static final Logger log = LoggerFactory.getLogger(NotificationMapper.class);
    private static final ObjectMapper JSON = new ObjectMapper();

    private NotificationMapper() {}

    public static NotificationResponse toResponse(Notification notification) {
        String link = computeLink(notification.getData());
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getBody(),
                notification.getData(),
                notification.isRead(),
                notification.getCreatedAt(),
                link
        );
    }

    private static String computeLink(String data) {
        if (data == null || data.isBlank()) return null;
        try {
            JsonNode node = JSON.readTree(data);
            if (node.has("requestId")) {
                return "/requests/" + node.get("requestId").asLong();
            }
        } catch (Exception e) {
            log.debug("Could not parse notification data for link: {}", e.getMessage());
        }
        return null;
    }
}
