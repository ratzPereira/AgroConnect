package com.agroconnect.unit;

import com.agroconnect.model.AuditLog;
import com.agroconnect.repository.AuditLogRepository;
import com.agroconnect.service.AuditService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Captor
    private ArgumentCaptor<AuditLog> auditLogCaptor;

    private AuditService service;

    @BeforeEach
    void setUp() {
        service = new AuditService(auditLogRepository, new ObjectMapper());
    }

    @Test
    void log_givenValidData_shouldSaveAuditEntry() {
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(inv -> inv.getArgument(0));

        service.log(1L, "PUBLISHED", "ServiceRequest", 42L, null, Map.of("status", "PUBLISHED"));

        verify(auditLogRepository).save(auditLogCaptor.capture());
        AuditLog saved = auditLogCaptor.getValue();

        assertEquals(1L, saved.getUserId());
        assertEquals("PUBLISHED", saved.getAction());
        assertEquals("ServiceRequest", saved.getEntityType());
        assertEquals(42L, saved.getEntityId());
        assertNull(saved.getOldData());
        assertEquals("{\"status\":\"PUBLISHED\"}", saved.getNewData());
    }

    @Test
    void log_givenStringData_shouldStoreAsIs() {
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(inv -> inv.getArgument(0));

        service.log(2L, "RELEASED", "Transaction", 10L, "HELD", "RELEASED");

        verify(auditLogRepository).save(auditLogCaptor.capture());
        AuditLog saved = auditLogCaptor.getValue();

        assertEquals("HELD", saved.getOldData());
        assertEquals("RELEASED", saved.getNewData());
    }

    @Test
    void log_givenNullData_shouldStoreNulls() {
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(inv -> inv.getArgument(0));

        service.log(1L, "CANCELLED", "ServiceRequest", 5L, null, null);

        verify(auditLogRepository).save(auditLogCaptor.capture());
        AuditLog saved = auditLogCaptor.getValue();

        assertNull(saved.getOldData());
        assertNull(saved.getNewData());
    }

    @Test
    void log_givenRepositoryException_shouldNotPropagate() {
        when(auditLogRepository.save(any(AuditLog.class))).thenThrow(new RuntimeException("DB error"));

        assertDoesNotThrow(() -> service.log(1L, "PUBLISHED", "ServiceRequest", 1L, null, null));
    }
}
