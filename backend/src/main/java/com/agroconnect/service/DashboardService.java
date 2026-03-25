package com.agroconnect.service;

import com.agroconnect.dto.response.ClientDashboardResponse;
import com.agroconnect.dto.response.NotificationResponse;
import com.agroconnect.dto.response.ServiceRequestSummaryResponse;
import com.agroconnect.mapper.NotificationMapper;
import com.agroconnect.mapper.ServiceRequestMapper;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.repository.NotificationRepository;
import com.agroconnect.repository.ProposalRepository;
import com.agroconnect.repository.ServiceRequestRepository;
import com.agroconnect.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private static final Set<RequestStatus> TERMINAL_STATES = EnumSet.of(
            RequestStatus.RATED, RequestStatus.EXPIRED, RequestStatus.CANCELLED);

    private final ServiceRequestRepository requestRepository;
    private final ProposalRepository proposalRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationRepository notificationRepository;

    public ClientDashboardResponse getClientDashboard(Long userId) {
        List<ServiceRequest> allRequests = requestRepository.findByClientId(userId);

        List<ServiceRequest> active = allRequests.stream()
                .filter(r -> !TERMINAL_STATES.contains(r.getStatus()) && r.getStatus() != RequestStatus.DRAFT)
                .toList();

        int completedCount = (int) allRequests.stream()
                .filter(r -> r.getStatus() == RequestStatus.COMPLETED || r.getStatus() == RequestStatus.RATED)
                .count();

        long totalProposals = proposalRepository.countActiveProposalsByClientId(userId);
        BigDecimal totalSpent = transactionRepository.sumReleasedAmountByClientId(userId);

        List<ServiceRequestSummaryResponse> recentRequests = active.stream()
                .sorted((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()))
                .limit(10)
                .map(sr -> {
                    int count = proposalRepository.findByRequestId(sr.getId()).size();
                    return ServiceRequestMapper.toSummaryResponse(sr, count);
                })
                .toList();

        List<NotificationResponse> recentNotifications = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 6))
                .map(NotificationMapper::toResponse)
                .getContent();

        return new ClientDashboardResponse(
                active.size(), totalProposals, completedCount,
                totalSpent, recentRequests, recentNotifications);
    }
}
