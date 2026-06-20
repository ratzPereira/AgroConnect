package com.agroconnect.scheduler;

import com.agroconnect.event.RequestExpiredEvent;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.repository.ServiceRequestRepository;
import com.agroconnect.service.UserDisplayNameResolver;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
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
    private final ApplicationEventPublisher eventPublisher;
    private final UserDisplayNameResolver nameResolver;

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void expirePublishedRequests() {
        List<ServiceRequest> expired = requestRepository.findExpiredPublished(Instant.now());

        for (ServiceRequest request : expired) {
            request.setStatus(RequestStatus.EXPIRED);
            requestRepository.save(request);
            log.info("Request expired: {}", request.getId());

            // ServiceRequest has no explicit publishedAt — fall back to createdAt as the
            // closest available signal of when the listing went live.
            eventPublisher.publishEvent(new RequestExpiredEvent(
                    request.getId(),
                    request.getClient().getId(),
                    request.getClient().getEmail(),
                    nameResolver.resolve(request.getClient()),
                    request.getTitle(),
                    request.getCreatedAt(),
                    Instant.now()));
        }

        if (!expired.isEmpty()) {
            log.info("Expired {} requests (PUBLISHED/WITH_PROPOSALS)", expired.size());
        }
    }
}
