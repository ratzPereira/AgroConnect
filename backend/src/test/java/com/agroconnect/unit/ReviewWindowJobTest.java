package com.agroconnect.unit;

import com.agroconnect.fixture.ServiceRequestFixture;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.repository.ServiceRequestRepository;
import com.agroconnect.scheduler.ReviewWindowJob;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
class ReviewWindowJobTest {

    @Mock
    private ServiceRequestRepository requestRepository;

    private ReviewWindowJob reviewWindowJob;

    @BeforeEach
    void setUp() {
        reviewWindowJob = new ReviewWindowJob(requestRepository);
    }

    @Test
    void closeExpiredReviewWindows_givenCompleted_shouldTransitionToRated() {
        ServiceRequest request = ServiceRequestFixture.aRequest()
                .id(1L)
                .status(RequestStatus.COMPLETED)
                .build();

        when(requestRepository.findCompletedBeforeDate(any(Instant.class)))
                .thenReturn(List.of(request));

        reviewWindowJob.closeExpiredReviewWindows();

        assertEquals(RequestStatus.RATED, request.getStatus());
        verify(requestRepository).save(request);
    }

    @Test
    void closeExpiredReviewWindows_givenNoExpired_shouldDoNothing() {
        when(requestRepository.findCompletedBeforeDate(any(Instant.class)))
                .thenReturn(Collections.emptyList());

        reviewWindowJob.closeExpiredReviewWindows();

        verify(requestRepository, never()).save(any(ServiceRequest.class));
    }

    @Test
    void closeExpiredReviewWindows_givenNonCompletedStatus_shouldSkip() {
        ServiceRequest request = ServiceRequestFixture.aRequest()
                .id(1L)
                .status(RequestStatus.RATED)
                .build();

        when(requestRepository.findCompletedBeforeDate(any(Instant.class)))
                .thenReturn(List.of(request));

        reviewWindowJob.closeExpiredReviewWindows();

        assertEquals(RequestStatus.RATED, request.getStatus());
        verify(requestRepository, never()).save(any(ServiceRequest.class));
    }

    @Test
    void closeExpiredReviewWindows_givenMultiple_shouldTransitionAll() {
        ServiceRequest request1 = ServiceRequestFixture.aRequest()
                .id(1L)
                .status(RequestStatus.COMPLETED)
                .build();
        ServiceRequest request2 = ServiceRequestFixture.aRequest()
                .id(2L)
                .status(RequestStatus.COMPLETED)
                .build();

        when(requestRepository.findCompletedBeforeDate(any(Instant.class)))
                .thenReturn(List.of(request1, request2));

        reviewWindowJob.closeExpiredReviewWindows();

        assertEquals(RequestStatus.RATED, request1.getStatus());
        assertEquals(RequestStatus.RATED, request2.getStatus());
        verify(requestRepository, times(2)).save(any(ServiceRequest.class));
    }

    @Test
    void closeExpiredReviewWindows_shouldUse7DayCutoff() {
        when(requestRepository.findCompletedBeforeDate(any(Instant.class)))
                .thenReturn(Collections.emptyList());

        Instant expectedCutoff = Instant.now().minus(7, ChronoUnit.DAYS);
        reviewWindowJob.closeExpiredReviewWindows();

        ArgumentCaptor<Instant> cutoffCaptor = ArgumentCaptor.forClass(Instant.class);
        verify(requestRepository).findCompletedBeforeDate(cutoffCaptor.capture());

        Instant capturedCutoff = cutoffCaptor.getValue();
        assertTrue(Duration.between(expectedCutoff, capturedCutoff).abs().toSeconds() < 5,
                "Cutoff should be approximately 7 days before now");
    }
}
