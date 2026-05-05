package com.agroconnect.unit;

import com.agroconnect.dto.response.NotificationResponse;
import com.agroconnect.mapper.NotificationMapper;
import com.agroconnect.model.Notification;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;

class NotificationMapperTest {

    @Test
    void toResponse_givenNotificationWithRequestId_shouldComputeLink() {
        Instant createdAt = Instant.now();
        Notification notification = Notification.builder()
                .id(1L)
                .type("NEW_PROPOSAL")
                .title("Nova proposta")
                .body("Recebeu uma nova proposta para o seu pedido")
                .data("{\"requestId\":42}")
                .read(false)
                .createdAt(createdAt)
                .build();

        NotificationResponse response = NotificationMapper.toResponse(notification);

        assertEquals(1L, response.id());
        assertEquals("NEW_PROPOSAL", response.type());
        assertEquals("Nova proposta", response.title());
        assertEquals("Recebeu uma nova proposta para o seu pedido", response.body());
        assertEquals("{\"requestId\":42}", response.data());
        assertFalse(response.read());
        assertEquals(createdAt, response.createdAt());
        assertEquals("/requests/42", response.link());
    }

    @Test
    void toResponse_givenNullData_shouldReturnNullLink() {
        Notification notification = Notification.builder()
                .id(2L)
                .type("SYSTEM")
                .title("Aviso")
                .body("Mensagem do sistema")
                .data(null)
                .read(false)
                .createdAt(Instant.now())
                .build();

        NotificationResponse response = NotificationMapper.toResponse(notification);

        assertNull(response.link());
    }

    @Test
    void toResponse_givenBlankData_shouldReturnNullLink() {
        Notification notification = Notification.builder()
                .id(3L)
                .type("SYSTEM")
                .title("Aviso")
                .body("Mensagem do sistema")
                .data("   ")
                .read(false)
                .createdAt(Instant.now())
                .build();

        NotificationResponse response = NotificationMapper.toResponse(notification);

        assertNull(response.link());
    }

    @Test
    void toResponse_givenDataWithoutRequestId_shouldReturnNullLink() {
        Notification notification = Notification.builder()
                .id(4L)
                .type("CHAT_MESSAGE")
                .title("Nova mensagem")
                .body("Tem uma nova mensagem")
                .data("{\"conversationId\":7}")
                .read(false)
                .createdAt(Instant.now())
                .build();

        NotificationResponse response = NotificationMapper.toResponse(notification);

        assertNull(response.link());
    }

    @Test
    void toResponse_givenInvalidJson_shouldReturnNullLink() {
        Notification notification = Notification.builder()
                .id(5L)
                .type("UNKNOWN")
                .title("Teste")
                .body("Corpo da notificação")
                .data("not-valid-json{{{")
                .read(false)
                .createdAt(Instant.now())
                .build();

        NotificationResponse response = NotificationMapper.toResponse(notification);

        assertNull(response.link());
        assertEquals(5L, response.id());
        assertEquals("not-valid-json{{{", response.data());
    }
}
