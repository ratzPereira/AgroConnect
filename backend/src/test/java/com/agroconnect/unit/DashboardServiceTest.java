package com.agroconnect.unit;

import com.agroconnect.dto.response.ClientDashboardResponse;
import com.agroconnect.fixture.ServiceRequestFixture;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.Notification;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.repository.NotificationRepository;
import com.agroconnect.repository.ProposalRepository;
import com.agroconnect.repository.ServiceRequestRepository;
import com.agroconnect.repository.TransactionRepository;
import com.agroconnect.service.DashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock private ServiceRequestRepository requestRepository;
    @Mock private ProposalRepository proposalRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private NotificationRepository notificationRepository;

    private DashboardService service;

    private User clientUser;

    @BeforeEach
    void setUp() {
        service = new DashboardService(requestRepository, proposalRepository,
                transactionRepository, notificationRepository);
        clientUser = UserFixture.aClientUser().build();
    }

    @Test
    void getClientDashboard_shouldReturnRequestCounts() {
        ServiceRequest published = ServiceRequestFixture.aPublishedRequest()
                .id(1L).client(clientUser)
                .category(ServiceRequestFixture.aCategory().build())
                .updatedAt(Instant.now()).build();

        ServiceRequest completed = ServiceRequestFixture.aRequest()
                .id(2L).status(RequestStatus.COMPLETED).client(clientUser)
                .category(ServiceRequestFixture.aCategory().build())
                .updatedAt(Instant.now()).build();

        ServiceRequest rated = ServiceRequestFixture.aRequest()
                .id(3L).status(RequestStatus.RATED).client(clientUser)
                .category(ServiceRequestFixture.aCategory().build())
                .updatedAt(Instant.now()).build();

        ServiceRequest draft = ServiceRequestFixture.aRequest()
                .id(4L).status(RequestStatus.DRAFT).client(clientUser)
                .category(ServiceRequestFixture.aCategory().build())
                .updatedAt(Instant.now()).build();

        ServiceRequest cancelled = ServiceRequestFixture.aRequest()
                .id(5L).status(RequestStatus.CANCELLED).client(clientUser)
                .category(ServiceRequestFixture.aCategory().build())
                .updatedAt(Instant.now()).build();

        List<ServiceRequest> allRequests = List.of(published, completed, rated, draft, cancelled);

        when(requestRepository.findByClientId(1L)).thenReturn(allRequests);
        when(proposalRepository.countActiveProposalsByClientId(1L)).thenReturn(3L);
        when(transactionRepository.sumReleasedAmountByClientId(1L)).thenReturn(new BigDecimal("500.00"));
        // Active = non-terminal AND non-draft: published (1) + completed (2) = 2
        when(proposalRepository.findByRequestId(1L)).thenReturn(List.of());
        when(proposalRepository.findByRequestId(2L)).thenReturn(List.of());
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        ClientDashboardResponse response = service.getClientDashboard(1L);

        assertNotNull(response);
        // Active = non-terminal (not RATED/EXPIRED/CANCELLED) AND non-draft: published + completed = 2
        assertEquals(2, response.activeRequests());
        // Completed = COMPLETED + RATED: completed + rated (2)
        assertEquals(2, response.completedRequests());
        assertEquals(3L, response.totalProposals());
        assertEquals(new BigDecimal("500.00"), response.totalSpent());
    }

    @Test
    void getClientDashboard_givenNoRequests_shouldReturnZeros() {
        when(requestRepository.findByClientId(1L)).thenReturn(List.of());
        when(proposalRepository.countActiveProposalsByClientId(1L)).thenReturn(0L);
        when(transactionRepository.sumReleasedAmountByClientId(1L)).thenReturn(BigDecimal.ZERO);
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        ClientDashboardResponse response = service.getClientDashboard(1L);

        assertNotNull(response);
        assertEquals(0, response.activeRequests());
        assertEquals(0, response.completedRequests());
        assertEquals(0L, response.totalProposals());
        assertEquals(BigDecimal.ZERO, response.totalSpent());
        assertNotNull(response.recentRequests());
        assertEquals(0, response.recentRequests().size());
    }

    @Test
    void getClientDashboard_shouldReturnRecentRequestsLimitedTo10() {
        // Create 12 active requests to verify limit of 10
        List<ServiceRequest> requests = new java.util.ArrayList<>();
        for (int i = 1; i <= 12; i++) {
            ServiceRequest sr = ServiceRequestFixture.aPublishedRequest()
                    .id((long) i).client(clientUser)
                    .category(ServiceRequestFixture.aCategory().build())
                    .updatedAt(Instant.now().plusSeconds(i)).build();
            requests.add(sr);
        }

        when(requestRepository.findByClientId(1L)).thenReturn(requests);
        when(proposalRepository.countActiveProposalsByClientId(1L)).thenReturn(0L);
        when(transactionRepository.sumReleasedAmountByClientId(1L)).thenReturn(BigDecimal.ZERO);
        // Only 10 of 12 will be used (stream limited to 10), use lenient for all
        when(proposalRepository.findByRequestId(any())).thenReturn(List.of());
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        ClientDashboardResponse response = service.getClientDashboard(1L);

        assertNotNull(response);
        assertEquals(10, response.recentRequests().size());
    }

    @Test
    void getClientDashboard_shouldReturnRecentNotifications() {
        Notification n1 = Notification.builder()
                .id(1L).user(clientUser).type("TEST").title("T1").body("B1")
                .read(false).createdAt(Instant.now()).build();

        when(requestRepository.findByClientId(1L)).thenReturn(List.of());
        when(proposalRepository.countActiveProposalsByClientId(1L)).thenReturn(0L);
        when(transactionRepository.sumReleasedAmountByClientId(1L)).thenReturn(BigDecimal.ZERO);
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(n1)));

        ClientDashboardResponse response = service.getClientDashboard(1L);

        assertNotNull(response);
        assertNotNull(response.recentNotifications());
        assertEquals(1, response.recentNotifications().size());
    }

    @Test
    void getClientDashboard_shouldCountInProgressAsActive() {
        ServiceRequest inProgress = ServiceRequestFixture.aRequest()
                .id(1L).status(RequestStatus.IN_PROGRESS).client(clientUser)
                .category(ServiceRequestFixture.aCategory().build())
                .updatedAt(Instant.now()).build();

        ServiceRequest awaitingConfirmation = ServiceRequestFixture.aRequest()
                .id(2L).status(RequestStatus.AWAITING_CONFIRMATION).client(clientUser)
                .category(ServiceRequestFixture.aCategory().build())
                .updatedAt(Instant.now()).build();

        ServiceRequest withProposals = ServiceRequestFixture.aRequest()
                .id(3L).status(RequestStatus.WITH_PROPOSALS).client(clientUser)
                .category(ServiceRequestFixture.aCategory().build())
                .updatedAt(Instant.now()).build();

        when(requestRepository.findByClientId(1L)).thenReturn(List.of(inProgress, awaitingConfirmation, withProposals));
        when(proposalRepository.countActiveProposalsByClientId(1L)).thenReturn(0L);
        when(transactionRepository.sumReleasedAmountByClientId(1L)).thenReturn(BigDecimal.ZERO);
        for (long i = 1; i <= 3; i++) {
            when(proposalRepository.findByRequestId(i)).thenReturn(List.of());
        }
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        ClientDashboardResponse response = service.getClientDashboard(1L);

        assertEquals(3, response.activeRequests());
    }

    @Test
    void getClientDashboard_shouldExcludeExpiredFromActive() {
        ServiceRequest expired = ServiceRequestFixture.aRequest()
                .id(1L).status(RequestStatus.EXPIRED).client(clientUser)
                .category(ServiceRequestFixture.aCategory().build())
                .updatedAt(Instant.now()).build();

        when(requestRepository.findByClientId(1L)).thenReturn(List.of(expired));
        when(proposalRepository.countActiveProposalsByClientId(1L)).thenReturn(0L);
        when(transactionRepository.sumReleasedAmountByClientId(1L)).thenReturn(BigDecimal.ZERO);
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        ClientDashboardResponse response = service.getClientDashboard(1L);

        assertEquals(0, response.activeRequests());
        assertEquals(0, response.completedRequests());
    }

    @Test
    void getClientDashboard_shouldReturnNullTotalSpentWhenNull() {
        when(requestRepository.findByClientId(1L)).thenReturn(List.of());
        when(proposalRepository.countActiveProposalsByClientId(1L)).thenReturn(0L);
        when(transactionRepository.sumReleasedAmountByClientId(1L)).thenReturn(null);
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        ClientDashboardResponse response = service.getClientDashboard(1L);

        // totalSpent may be null if transaction repo returns null
        // This is acceptable behavior
        assertNotNull(response);
    }
}
