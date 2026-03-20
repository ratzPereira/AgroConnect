package com.agroconnect.unit;

import com.agroconnect.dto.response.AdminDashboardResponse;
import com.agroconnect.dto.response.AdminUserResponse;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.model.enums.Role;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.ProposalRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.ReviewRepository;
import com.agroconnect.repository.ServiceRequestRepository;
import com.agroconnect.repository.TransactionRepository;
import com.agroconnect.repository.UserRepository;
import com.agroconnect.service.AdminService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private ServiceRequestRepository requestRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private ProposalRepository proposalRepository;
    @Mock private ClientProfileRepository clientProfileRepository;
    @Mock private ProviderProfileRepository providerProfileRepository;

    private AdminService service;

    @BeforeEach
    void setUp() {
        service = new AdminService(
                userRepository, requestRepository, transactionRepository,
                reviewRepository, proposalRepository, clientProfileRepository,
                providerProfileRepository);
    }

    @Test
    void getDashboard_shouldReturnAggregatedMetrics() {
        when(userRepository.count()).thenReturn(100L);
        when(userRepository.countByRole(Role.CLIENT)).thenReturn(70L);
        when(userRepository.countByRole(Role.PROVIDER_MANAGER)).thenReturn(25L);
        when(requestRepository.count()).thenReturn(200L);
        when(requestRepository.countActiveRequests()).thenReturn(50L);
        when(transactionRepository.sumTotalAmount()).thenReturn(new BigDecimal("50000.00"));
        when(transactionRepository.sumTotalCommissions()).thenReturn(new BigDecimal("6000.00"));
        when(requestRepository.countByStatus(RequestStatus.DISPUTED)).thenReturn(3L);
        when(reviewRepository.findAverageRating()).thenReturn(4.2);

        AdminDashboardResponse response = service.getDashboard();

        assertNotNull(response);
        assertEquals(100, response.totalUsers());
        assertEquals(70, response.totalClients());
        assertEquals(3, response.pendingDisputes());
        assertEquals(4.2, response.avgPlatformRating());
    }

    @Test
    void listUsers_givenRoleFilter_shouldFilterByRole() {
        User client = UserFixture.aClientUser().build();
        Page<User> page = new PageImpl<>(List.of(client));

        when(userRepository.findByRoleOrderByCreatedAtDesc(eq(Role.CLIENT), any())).thenReturn(page);
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(UserFixture.aClientProfile().user(client).build()));
        when(requestRepository.countByClientId(1L)).thenReturn(5L);
        when(proposalRepository.countByProviderUserId(1L)).thenReturn(0L);

        Page<AdminUserResponse> result = service.listUsers(Role.CLIENT, PageRequest.of(0, 20));

        assertEquals(1, result.getTotalElements());
        assertEquals("João Silva", result.getContent().get(0).name());
    }

    @Test
    void banUser_givenValidUser_shouldSetInactive() {
        User user = UserFixture.aClientUser().build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        service.banUser(1L);

        assertEquals(false, user.isActive());
        verify(userRepository).save(user);
    }

    @Test
    void listDisputes_shouldReturnDisputedRequests() {
        when(requestRepository.findByStatusOrderByCreatedAtDesc(eq(RequestStatus.DISPUTED), any()))
                .thenReturn(Page.empty());

        var result = service.listDisputes(PageRequest.of(0, 20));

        assertNotNull(result);
    }
}
