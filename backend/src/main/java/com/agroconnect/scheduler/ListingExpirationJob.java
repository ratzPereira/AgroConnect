package com.agroconnect.scheduler;

import com.agroconnect.service.ListingService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ListingExpirationJob {

    private static final Logger log = LoggerFactory.getLogger(ListingExpirationJob.class);

    private final ListingService listingService;

    @Scheduled(cron = "0 15 * * * *")
    public void expireListings() {
        log.debug("Running listing expiration job");
        listingService.expireListings();
    }
}
