package com.agroconnect.service;

import com.agroconnect.model.AuditLog;
import com.agroconnect.repository.AuditLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(Long userId, String action, String entityType, Long entityId,
                    Object oldData, Object newData) {
        try {
            AuditLog entry = AuditLog.builder()
                    .userId(userId)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .oldData(serialize(oldData))
                    .newData(serialize(newData))
                    .build();

            auditLogRepository.save(entry);
            log.debug("Audit: {} {} {} by user {}", action, entityType, entityId, userId);
        } catch (Exception e) {
            log.error("Failed to write audit log: {} {} {}", action, entityType, entityId, e);
        }
    }

    private String serialize(Object data) {
        if (data == null) {
            return null;
        }
        if (data instanceof String s) {
            return s;
        }
        try {
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize audit data", e);
            return data.toString();
        }
    }
}
