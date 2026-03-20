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
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ReviewWindowJob {

    private static final Logger log = LoggerFactory.getLogger(ReviewWindowJob.class);
    private static final int REVIEW_WINDOW_DAYS = 7;

    private final ServiceRequestRepository requestRepository;

    @Scheduled(cron = "0 0 2 * * *") // Daily at 2 AM
    @Transactional
    public void closeExpiredReviewWindows() {
        Instant cutoff = Instant.now().minus(REVIEW_WINDOW_DAYS, ChronoUnit.DAYS);
        List<ServiceRequest> requests = requestRepository.findCompletedBeforeDate(cutoff);

        int count = 0;
        for (ServiceRequest request : requests) {
            if (request.getStatus() == RequestStatus.COMPLETED) {
                request.setStatus(RequestStatus.RATED);
                requestRepository.save(request);
                count++;
                log.info("Review window expired for request {} — transitioned to RATED", request.getId());
            }
        }

        if (count > 0) {
            log.info("Review window job closed {} expired review windows", count);
        }
    }
}
