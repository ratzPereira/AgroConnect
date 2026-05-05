package com.agroconnect.unit;

import com.agroconnect.fixture.ServiceRequestFixture;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.repository.ServiceRequestRepository;
import com.agroconnect.scheduler.RequestExpirationJob;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RequestExpirationJobTest {

    @Mock
    private ServiceRequestRepository requestRepository;

    private RequestExpirationJob requestExpirationJob;

    @BeforeEach
    void setUp() {
        requestExpirationJob = new RequestExpirationJob(requestRepository);
    }

    @Test
    void expirePublishedRequests_givenExpired_shouldSetExpired() {
        ServiceRequest request = ServiceRequestFixture.aPublishedRequest()
                .id(1L)
                .status(RequestStatus.PUBLISHED)
                .build();

        when(requestRepository.findExpiredPublished(any(Instant.class)))
                .thenReturn(List.of(request));

        requestExpirationJob.expirePublishedRequests();

        assertEquals(RequestStatus.EXPIRED, request.getStatus());
        verify(requestRepository).save(request);
    }

    @Test
    void expirePublishedRequests_givenNoExpired_shouldDoNothing() {
        when(requestRepository.findExpiredPublished(any(Instant.class)))
                .thenReturn(Collections.emptyList());

        requestExpirationJob.expirePublishedRequests();

        verify(requestRepository, never()).save(any(ServiceRequest.class));
    }

    @Test
    void expirePublishedRequests_givenMultiple_shouldExpireAll() {
        ServiceRequest request1 = ServiceRequestFixture.aPublishedRequest()
                .id(1L)
                .status(RequestStatus.PUBLISHED)
                .build();
        ServiceRequest request2 = ServiceRequestFixture.aPublishedRequest()
                .id(2L)
                .status(RequestStatus.PUBLISHED)
                .build();

        when(requestRepository.findExpiredPublished(any(Instant.class)))
                .thenReturn(List.of(request1, request2));

        requestExpirationJob.expirePublishedRequests();

        assertEquals(RequestStatus.EXPIRED, request1.getStatus());
        assertEquals(RequestStatus.EXPIRED, request2.getStatus());
        verify(requestRepository, times(2)).save(any(ServiceRequest.class));
    }

    @Test
    void expirePublishedRequests_shouldPassCurrentInstantToRepository() {
        when(requestRepository.findExpiredPublished(any(Instant.class)))
                .thenReturn(Collections.emptyList());

        Instant before = Instant.now();
        requestExpirationJob.expirePublishedRequests();
        Instant after = Instant.now();

        ArgumentCaptor<Instant> instantCaptor = ArgumentCaptor.forClass(Instant.class);
        verify(requestRepository).findExpiredPublished(instantCaptor.capture());

        Instant captured = instantCaptor.getValue();
        assertTrue(!captured.isBefore(before) && !captured.isAfter(after),
                "Instant passed to repository should be between before and after the method call");
    }
}
