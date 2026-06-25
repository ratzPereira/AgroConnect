package com.agroconnect.service;

import com.agroconnect.dto.response.AdminAnalyticsResponse;
import com.agroconnect.dto.response.AdminAnalyticsResponse.DayCount;
import com.agroconnect.dto.response.AdminAnalyticsResponse.DayRevenue;
import com.agroconnect.dto.response.AdminAnalyticsResponse.LabelCount;
import com.agroconnect.dto.response.AdminDashboardResponse;
import com.agroconnect.dto.response.AdminDisputeResponse;
import com.agroconnect.dto.response.AdminUserResponse;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.Proposal;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.User;
import com.agroconnect.dto.response.ListingResponse;
import com.agroconnect.dto.response.ListingSummaryResponse;
import com.agroconnect.mapper.ListingMapper;
import com.agroconnect.model.Listing;
import com.agroconnect.model.enums.ListingStatus;
import com.agroconnect.model.enums.ProposalStatus;
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
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

    private static final String ERR_USER_NOT_FOUND = "Utilizador não encontrado.";

    private static final int ANALYTICS_DAYS = 14;

    private final UserRepository userRepository;
    private final ServiceRequestRepository requestRepository;
    private final TransactionRepository transactionRepository;
    private final ReviewRepository reviewRepository;
    private final ProposalRepository proposalRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final ListingRepository listingRepository;
    private final ListingService listingService;

    public AdminDashboardResponse getDashboard() {
        long totalUsers = userRepository.count();
        long totalClients = userRepository.countByRole(Role.CLIENT);
        long totalProviders = userRepository.countByRole(Role.PROVIDER_MANAGER);
        long totalRequests = requestRepository.count();
        long activeRequests = requestRepository.countActiveRequests();
        BigDecimal totalVolume = transactionRepository.sumTotalAmount();
        BigDecimal totalCommissions = transactionRepository.sumTotalCommissions();
        long pendingDisputes = requestRepository.countByStatus(RequestStatus.DISPUTED);
        double avgPlatformRating = reviewRepository.findAverageRating();
        long totalListings = listingRepository.count();
        long activeListings = listingRepository.countByStatus(ListingStatus.ACTIVE);
        long soldListings = listingRepository.countByStatus(ListingStatus.SOLD);

        return new AdminDashboardResponse(
                totalUsers, totalClients, totalProviders,
                totalRequests, activeRequests,
                totalVolume, totalCommissions,
                pendingDisputes, avgPlatformRating,
                totalListings, activeListings, soldListings
        );
    }

    public AdminAnalyticsResponse getAnalytics() {
        List<LabelCount> usersByRole = Arrays.stream(Role.values())
                .map(role -> new LabelCount(role.name(), userRepository.countByRole(role)))
                .toList();

        List<LabelCount> requestsByStatus = Arrays.stream(RequestStatus.values())
                .map(status -> new LabelCount(status.name(), requestRepository.countByStatus(status)))
                .toList();

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        List<DayCount> registrationsDaily = new ArrayList<>();
        List<DayCount> requestsDaily = new ArrayList<>();
        List<DayRevenue> revenueDaily = new ArrayList<>();

        for (int i = ANALYTICS_DAYS - 1; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            Instant from = day.atStartOfDay(ZoneOffset.UTC).toInstant();
            Instant to = day.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

            registrationsDaily.add(new DayCount(day,
                    userRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(from, to)));
            requestsDaily.add(new DayCount(day,
                    requestRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(from, to)));
            revenueDaily.add(new DayRevenue(day,
                    transactionRepository.sumAmountBetween(from, to),
                    transactionRepository.sumCommissionsBetween(from, to)));
        }

        return new AdminAnalyticsResponse(usersByRole, requestsByStatus,
                registrationsDaily, requestsDaily, revenueDaily);
    }

    public Page<AdminUserResponse> listUsers(Role role, Pageable pageable) {
        Page<User> users;
        if (role != null) {
            users = userRepository.findByRoleOrderByCreatedAtDesc(role, pageable);
        } else {
            users = userRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        return users.map(this::toAdminUserResponse);
    }

    public AdminUserResponse getUserDetail(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_USER_NOT_FOUND));
        return toAdminUserResponse(user);
    }

    @Transactional
    public void banUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_USER_NOT_FOUND));
        user.setActive(false);
        userRepository.save(user);
        log.info("User {} banned by admin", userId);
    }

    @Transactional
    public void unbanUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_USER_NOT_FOUND));
        user.setActive(true);
        userRepository.save(user);
        log.info("User {} unbanned by admin", userId);
    }

    public Page<ListingSummaryResponse> listListings(ListingStatus status, Pageable pageable) {
        Page<Listing> page;
        if (status != null) {
            page = listingRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else {
            page = listingRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        return page.map(listing -> ListingMapper.toSummaryResponse(listing, null));
    }

    public ListingResponse getListingDetail(Long id, Long adminUserId) {
        return listingService.findById(id, adminUserId);
    }

    @Transactional
    public ListingResponse removeListing(Long id, Long adminUserId) {
        return listingService.remove(id, adminUserId);
    }

    public Page<AdminDisputeResponse> listDisputes(Pageable pageable) {
        return requestRepository.findByStatusOrderByCreatedAtDesc(RequestStatus.DISPUTED, pageable)
                .map(this::toAdminDisputeResponse);
    }

    private AdminUserResponse toAdminUserResponse(User user) {
        String name = getDisplayName(user);
        long requestCount = requestRepository.countByClientId(user.getId());
        long proposalCount = proposalRepository.countByProviderUserId(user.getId());

        return new AdminUserResponse(
                user.getId(),
                name,
                user.getEmail(),
                user.getRole(),
                user.isActive(),
                user.getCreatedAt(),
                requestCount,
                proposalCount
        );
    }

    private AdminDisputeResponse toAdminDisputeResponse(ServiceRequest request) {
        String clientName = getDisplayName(request.getClient());

        String providerName = proposalRepository.findByRequestId(request.getId()).stream()
                .filter(p -> p.getStatus() == ProposalStatus.ACCEPTED)
                .findFirst()
                .map(Proposal::getProvider)
                .map(ProviderProfile::getCompanyName)
                .orElse("N/A");

        BigDecimal amount = transactionRepository.findByRequestId(request.getId())
                .map(tx -> tx.getAmount())
                .orElse(BigDecimal.ZERO);

        return new AdminDisputeResponse(
                request.getId(),
                clientName,
                providerName,
                request.getTitle(),
                amount,
                request.getCreatedAt()
        );
    }

    private String getDisplayName(User user) {
        return clientProfileRepository.findByUserId(user.getId())
                .map(ClientProfile::getName)
                .orElseGet(() -> providerProfileRepository.findByUserId(user.getId())
                        .map(ProviderProfile::getCompanyName)
                        .orElse(user.getEmail()));
    }
}
