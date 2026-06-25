package com.agroconnect.unit;

import com.agroconnect.dto.response.AdminAnalyticsResponse;
import com.agroconnect.dto.response.AdminDashboardResponse;
import com.agroconnect.dto.response.AdminUserResponse;
import com.agroconnect.dto.response.ListingResponse;
import com.agroconnect.dto.response.ListingSummaryResponse;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.fixture.ServiceRequestFixture;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.Listing;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.ListingStatus;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.model.enums.Role;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.ListingRepository;
import com.agroconnect.repository.ProposalRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.ReviewRepository;
import com.agroconnect.repository.ServiceRequestRepository;
import com.agroconnect.repository.TransactionRepository;
import com.agroconnect.repository.UserRepository;
import com.agroconnect.service.AdminService;
import com.agroconnect.service.ListingService;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
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
    @Mock private ListingRepository listingRepository;
    @Mock private ListingService listingService;

    private AdminService service;

    @BeforeEach
    void setUp() {
        service = new AdminService(
                userRepository, requestRepository, transactionRepository,
                reviewRepository, proposalRepository, clientProfileRepository,
                providerProfileRepository, listingRepository, listingService);
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
        when(listingRepository.count()).thenReturn(30L);
        when(listingRepository.countByStatus(ListingStatus.ACTIVE)).thenReturn(20L);
        when(listingRepository.countByStatus(ListingStatus.SOLD)).thenReturn(8L);

        AdminDashboardResponse response = service.getDashboard();

        assertNotNull(response);
        assertEquals(100, response.totalUsers());
        assertEquals(70, response.totalClients());
        assertEquals(3, response.pendingDisputes());
        assertEquals(4.2, response.avgPlatformRating());
        assertEquals(30, response.totalListings());
        assertEquals(20, response.activeListings());
        assertEquals(8, response.soldListings());
    }

    @Test
    void getAnalytics_shouldReturnDistributionsAndFourteenDayTimeSeries() {
        when(userRepository.countByRole(any())).thenReturn(10L);
        when(requestRepository.countByStatus(any())).thenReturn(5L);
        when(userRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(any(), any())).thenReturn(2L);
        when(requestRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(any(), any())).thenReturn(3L);
        when(transactionRepository.sumAmountBetween(any(), any())).thenReturn(new BigDecimal("100.00"));
        when(transactionRepository.sumCommissionsBetween(any(), any())).thenReturn(new BigDecimal("12.00"));

        AdminAnalyticsResponse r = service.getAnalytics();

        assertEquals(Role.values().length, r.usersByRole().size());
        assertEquals(10L, r.usersByRole().get(0).count());
        assertEquals(RequestStatus.values().length, r.requestsByStatus().size());
        assertEquals(5L, r.requestsByStatus().get(0).count());
        assertEquals(14, r.registrationsDaily().size());
        assertEquals(2L, r.registrationsDaily().get(0).count());
        assertEquals(14, r.requestsDaily().size());
        assertEquals(3L, r.requestsDaily().get(0).count());
        assertEquals(14, r.revenueDaily().size());
        assertEquals(new BigDecimal("100.00"), r.revenueDaily().get(0).amount());
        assertEquals(new BigDecimal("12.00"), r.revenueDaily().get(0).commission());
        assertEquals(true, r.registrationsDaily().get(0).date()
                .isBefore(r.registrationsDaily().get(13).date()));
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

    @Test
    void unbanUser_givenValidUser_shouldSetActive() {
        User user = UserFixture.aClientUser().active(false).build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        service.unbanUser(1L);

        assertEquals(true, user.isActive());
        verify(userRepository).save(user);
    }

    @Test
    void banUser_givenNonExistentUser_shouldThrowNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.banUser(999L));
    }

    @Test
    void unbanUser_givenNonExistentUser_shouldThrowNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.unbanUser(999L));
    }

    @Test
    void getUserDetail_givenValidUser_shouldReturnResponse() {
        User user = UserFixture.aClientUser().build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(UserFixture.aClientProfile().user(user).build()));
        when(requestRepository.countByClientId(1L)).thenReturn(3L);
        when(proposalRepository.countByProviderUserId(1L)).thenReturn(0L);

        AdminUserResponse result = service.getUserDetail(1L);

        assertNotNull(result);
        assertEquals("João Silva", result.name());
        assertEquals(3L, result.requestCount());
    }

    @Test
    void getUserDetail_givenNonExistentUser_shouldThrowNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.getUserDetail(999L));
    }

    @Test
    void listUsers_givenNullRole_shouldReturnAllUsers() {
        User user = UserFixture.aClientUser().build();
        Page<User> page = new PageImpl<>(List.of(user));

        when(userRepository.findAllByOrderByCreatedAtDesc(any())).thenReturn(page);
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(UserFixture.aClientProfile().user(user).build()));
        when(requestRepository.countByClientId(1L)).thenReturn(0L);
        when(proposalRepository.countByProviderUserId(1L)).thenReturn(0L);

        Page<AdminUserResponse> result = service.listUsers(null, PageRequest.of(0, 20));

        assertEquals(1, result.getTotalElements());
        verify(userRepository).findAllByOrderByCreatedAtDesc(any());
    }

    @Test
    void getDisplayName_givenProviderUser_shouldReturnCompanyName() {
        User user = UserFixture.aProviderUser().build();
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(clientProfileRepository.findByUserId(2L)).thenReturn(Optional.empty());
        when(providerProfileRepository.findByUserId(2L)).thenReturn(
                Optional.of(UserFixture.aProviderProfile().user(user).build()));
        when(requestRepository.countByClientId(2L)).thenReturn(0L);
        when(proposalRepository.countByProviderUserId(2L)).thenReturn(5L);

        AdminUserResponse result = service.getUserDetail(2L);

        assertEquals("AgroServiços Terceira", result.name());
        assertEquals(5L, result.proposalCount());
    }

    @Test
    void getDisplayName_givenNoProfile_shouldReturnEmail() {
        User user = UserFixture.aClientUser().build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(requestRepository.countByClientId(1L)).thenReturn(0L);
        when(proposalRepository.countByProviderUserId(1L)).thenReturn(0L);

        AdminUserResponse result = service.getUserDetail(1L);

        assertEquals("joao.silva@email.pt", result.name());
    }

    @Test
    void listListings_givenStatusFilter_shouldFilterByStatus() {
        Listing listing = Listing.builder().id(1L).title("Tractor")
                .status(ListingStatus.ACTIVE).build();
        Page<Listing> page = new PageImpl<>(List.of(listing));

        when(listingRepository.findByStatusOrderByCreatedAtDesc(eq(ListingStatus.ACTIVE), any()))
                .thenReturn(page);

        Page<ListingSummaryResponse> result = service.listListings(ListingStatus.ACTIVE, PageRequest.of(0, 20));

        assertEquals(1, result.getTotalElements());
        verify(listingRepository).findByStatusOrderByCreatedAtDesc(eq(ListingStatus.ACTIVE), any());
    }

    @Test
    void listListings_givenNullStatus_shouldReturnAllListings() {
        when(listingRepository.findAllByOrderByCreatedAtDesc(any()))
                .thenReturn(Page.empty());

        Page<ListingSummaryResponse> result = service.listListings(null, PageRequest.of(0, 20));

        assertNotNull(result);
        verify(listingRepository).findAllByOrderByCreatedAtDesc(any());
    }

    @Test
    void removeListing_shouldDelegateToListingService() {
        ListingResponse expected = new ListingResponse(
                1L, "Test", "desc", null, false, null, null, null,
                null, null, null, null, null, null, null,
                ListingStatus.REMOVED, 0, 1L, "Seller", null, 0,
                List.of(), 0L, false, null, null, null);
        when(listingService.remove(1L, 99L)).thenReturn(expected);

        ListingResponse result = service.removeListing(1L, 99L);

        assertEquals(expected, result);
        verify(listingService).remove(1L, 99L);
    }

    @Test
    void getListingDetail_shouldDelegateToListingService() {
        ListingResponse expected = new ListingResponse(
                1L, "Test", "desc", null, false, null, null, null,
                null, null, null, null, null, null, null,
                ListingStatus.ACTIVE, 0, 1L, "Seller", null, 0,
                List.of(), 0L, false, null, null, null);
        when(listingService.findById(1L, 99L)).thenReturn(expected);

        ListingResponse result = service.getListingDetail(1L, 99L);

        assertEquals(expected, result);
        verify(listingService).findById(1L, 99L);
    }

    @Test
    void listDisputes_givenDisputedRequest_shouldReturnMappedResponse() {
        User disputeClient = UserFixture.aClientUser().build();
        var category = ServiceRequestFixture.aCategory().build();
        var request = ServiceRequestFixture.aRequest()
                .status(RequestStatus.DISPUTED).client(disputeClient).category(category).build();

        Page<com.agroconnect.model.ServiceRequest> page = new PageImpl<>(List.of(request));
        when(requestRepository.findByStatusOrderByCreatedAtDesc(eq(RequestStatus.DISPUTED), any()))
                .thenReturn(page);
        when(clientProfileRepository.findByUserId(1L)).thenReturn(
                Optional.of(UserFixture.aClientProfile().user(disputeClient).build()));
        when(proposalRepository.findByRequestId(1L)).thenReturn(List.of());
        when(transactionRepository.findByRequestId(1L)).thenReturn(Optional.empty());

        var result = service.listDisputes(PageRequest.of(0, 20));

        assertEquals(1, result.getTotalElements());
        assertEquals("N/A", result.getContent().get(0).providerName());
    }
}
