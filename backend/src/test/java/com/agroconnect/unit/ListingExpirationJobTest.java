package com.agroconnect.unit;

import com.agroconnect.scheduler.ListingExpirationJob;
import com.agroconnect.service.ListingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ListingExpirationJobTest {

    @Mock
    private ListingService listingService;

    private ListingExpirationJob listingExpirationJob;

    @BeforeEach
    void setUp() {
        listingExpirationJob = new ListingExpirationJob(listingService);
    }

    @Test
    void expireListings_shouldDelegateToListingService() {
        listingExpirationJob.expireListings();

        verify(listingService).expireListings();
    }
}
