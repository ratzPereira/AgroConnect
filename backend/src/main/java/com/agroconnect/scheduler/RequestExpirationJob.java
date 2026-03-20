package com.agroconnect.scheduler;

import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.repository.ServiceRequestRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
public class RequestExpirationJob {

    private static final Logger log = LoggerFactory.getLogger(RequestExpirationJob.class);

    private final ServiceRequestRepository requestRepository;

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void expirePublishedRequests() {
        List<ServiceRequest> expired = requestRepository.findExpiredPublished(Instant.now());

        for (ServiceRequest request : expired) {
            request.setStatus(RequestStatus.EXPIRED);
            requestRepository.save(request);
            log.info("Request expired: {}", request.getId());
        }

        if (!expired.isEmpty()) {
            log.info("Expired {} published requests", expired.size());
        }
    }
}
