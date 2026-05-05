package com.agroconnect.unit;

import com.agroconnect.fixture.ExecutionFixture;
import com.agroconnect.fixture.ProposalFixture;
import com.agroconnect.fixture.ServiceRequestFixture;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.Proposal;
import com.agroconnect.model.ServiceExecution;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.repository.ServiceExecutionRepository;
import com.agroconnect.repository.ServiceRequestRepository;
import com.agroconnect.scheduler.AutoConfirmJob;
import com.agroconnect.service.NotificationService;
import com.agroconnect.service.TransactionService;
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
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AutoConfirmJobTest {

    @Mock
    private ServiceExecutionRepository executionRepository;

    @Mock
    private ServiceRequestRepository requestRepository;

    @Mock
    private TransactionService transactionService;

    @Mock
    private NotificationService notificationService;

    private AutoConfirmJob autoConfirmJob;

    @BeforeEach
    void setUp() {
        autoConfirmJob = new AutoConfirmJob(executionRepository, requestRepository, transactionService, notificationService);
    }

    @Test
    void autoConfirmExpiredExecutions_givenExpiredExecution_shouldCompleteAndRelease() {
        User client = UserFixture.aClientUser().id(10L).build();
        ServiceRequest request = ServiceRequestFixture.aRequest()
                .id(5L)
                .status(RequestStatus.AWAITING_CONFIRMATION)
                .client(client)
                .title("Lavoura de teste")
                .build();
        Proposal proposal = ProposalFixture.aProposal().request(request).build();
        ServiceExecution execution = ExecutionFixture.anExecution().proposal(proposal).build();

        when(executionRepository.findCompletedAwaitingConfirmationBefore(any(Instant.class)))
                .thenReturn(List.of(execution));

        autoConfirmJob.autoConfirmExpiredExecutions();

        assertEquals(RequestStatus.COMPLETED, request.getStatus());
        verify(requestRepository).save(request);
        verify(transactionService).release(5L);
        verify(notificationService).create(eq(10L), eq("AUTO_CONFIRMED"), anyString(), anyString());
    }

    @Test
    void autoConfirmExpiredExecutions_givenNoExpired_shouldDoNothing() {
        when(executionRepository.findCompletedAwaitingConfirmationBefore(any(Instant.class)))
                .thenReturn(Collections.emptyList());

        autoConfirmJob.autoConfirmExpiredExecutions();

        verify(requestRepository, never()).save(any(ServiceRequest.class));
        verify(transactionService, never()).release(anyLong());
        verify(notificationService, never()).create(anyLong(), anyString(), anyString(), anyString());
    }

    @Test
    void autoConfirmExpiredExecutions_givenRequestNotAwaitingConfirmation_shouldSkip() {
        User client = UserFixture.aClientUser().id(10L).build();
        ServiceRequest request = ServiceRequestFixture.aRequest()
                .id(5L)
                .status(RequestStatus.IN_PROGRESS)
                .client(client)
                .title("Lavoura de teste")
                .build();
        Proposal proposal = ProposalFixture.aProposal().request(request).build();
        ServiceExecution execution = ExecutionFixture.anExecution().proposal(proposal).build();

        when(executionRepository.findCompletedAwaitingConfirmationBefore(any(Instant.class)))
                .thenReturn(List.of(execution));

        autoConfirmJob.autoConfirmExpiredExecutions();

        assertEquals(RequestStatus.IN_PROGRESS, request.getStatus());
        verify(requestRepository, never()).save(any(ServiceRequest.class));
        verify(transactionService, never()).release(anyLong());
        verify(notificationService, never()).create(anyLong(), anyString(), anyString(), anyString());
    }

    @Test
    void autoConfirmExpiredExecutions_givenMultipleExecutions_shouldProcessAll() {
        User client1 = UserFixture.aClientUser().id(10L).build();
        ServiceRequest request1 = ServiceRequestFixture.aRequest()
                .id(5L)
                .status(RequestStatus.AWAITING_CONFIRMATION)
                .client(client1)
                .title("Lavoura 1")
                .build();
        Proposal proposal1 = ProposalFixture.aProposal().id(1L).request(request1).build();
        ServiceExecution execution1 = ExecutionFixture.anExecution().id(1L).proposal(proposal1).build();

        User client2 = UserFixture.aClientUser().id(20L).build();
        ServiceRequest request2 = ServiceRequestFixture.aRequest()
                .id(6L)
                .status(RequestStatus.AWAITING_CONFIRMATION)
                .client(client2)
                .title("Lavoura 2")
                .build();
        Proposal proposal2 = ProposalFixture.aProposal().id(2L).request(request2).build();
        ServiceExecution execution2 = ExecutionFixture.anExecution().id(2L).proposal(proposal2).build();

        when(executionRepository.findCompletedAwaitingConfirmationBefore(any(Instant.class)))
                .thenReturn(List.of(execution1, execution2));

        autoConfirmJob.autoConfirmExpiredExecutions();

        assertEquals(RequestStatus.COMPLETED, request1.getStatus());
        assertEquals(RequestStatus.COMPLETED, request2.getStatus());
        verify(requestRepository, times(2)).save(any(ServiceRequest.class));
        verify(transactionService).release(5L);
        verify(transactionService).release(6L);
        verify(notificationService, times(2)).create(anyLong(), eq("AUTO_CONFIRMED"), anyString(), anyString());
    }

    @Test
    void autoConfirmExpiredExecutions_shouldUse48HourCutoff() {
        when(executionRepository.findCompletedAwaitingConfirmationBefore(any(Instant.class)))
                .thenReturn(Collections.emptyList());

        Instant before = Instant.now().minus(48, ChronoUnit.HOURS);
        autoConfirmJob.autoConfirmExpiredExecutions();
        Instant after = Instant.now().minus(48, ChronoUnit.HOURS);

        ArgumentCaptor<Instant> cutoffCaptor = ArgumentCaptor.forClass(Instant.class);
        verify(executionRepository).findCompletedAwaitingConfirmationBefore(cutoffCaptor.capture());

        Instant capturedCutoff = cutoffCaptor.getValue();
        assertTrue(Duration.between(before, capturedCutoff).abs().toSeconds() < 5,
                "Cutoff should be approximately 48 hours before now");
        assertTrue(Duration.between(after, capturedCutoff).abs().toSeconds() < 5,
                "Cutoff should be approximately 48 hours before now");
    }

    @Test
    void autoConfirmExpiredExecutions_shouldSendNotificationWithCorrectContent() {
        User client = UserFixture.aClientUser().id(10L).build();
        ServiceRequest request = ServiceRequestFixture.aRequest()
                .id(5L)
                .status(RequestStatus.AWAITING_CONFIRMATION)
                .client(client)
                .title("Lavoura especial")
                .build();
        Proposal proposal = ProposalFixture.aProposal().request(request).build();
        ServiceExecution execution = ExecutionFixture.anExecution().proposal(proposal).build();

        when(executionRepository.findCompletedAwaitingConfirmationBefore(any(Instant.class)))
                .thenReturn(List.of(execution));

        autoConfirmJob.autoConfirmExpiredExecutions();

        ArgumentCaptor<String> typeCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> titleCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);

        verify(notificationService).create(eq(10L), typeCaptor.capture(), titleCaptor.capture(), bodyCaptor.capture());

        assertEquals("AUTO_CONFIRMED", typeCaptor.getValue());
        assertEquals("Servi\u00e7o confirmado automaticamente", titleCaptor.getValue());
        assertTrue(bodyCaptor.getValue().contains("Lavoura especial"),
                "Notification body should contain the request title");
        assertTrue(bodyCaptor.getValue().contains("48 horas"),
                "Notification body should mention 48 hours");
    }
}
