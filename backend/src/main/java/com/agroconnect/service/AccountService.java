package com.agroconnect.service;

import com.agroconnect.dto.response.DataExportResponse;
import com.agroconnect.dto.response.DataExportResponse.MessageData;
import com.agroconnect.dto.response.DataExportResponse.NotificationData;
import com.agroconnect.dto.response.DataExportResponse.ProposalData;
import com.agroconnect.dto.response.DataExportResponse.RequestData;
import com.agroconnect.dto.response.DataExportResponse.ReviewData;
import com.agroconnect.dto.response.DataExportResponse.TransactionData;
import com.agroconnect.dto.response.DataExportResponse.UserData;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.exception.ValidationException;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.model.enums.Role;
import com.agroconnect.repository.ChatMessageRepository;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.NotificationRepository;
import com.agroconnect.repository.ProposalRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.RefreshTokenRepository;
import com.agroconnect.repository.ReviewRepository;
import com.agroconnect.repository.ServiceRequestRepository;
import com.agroconnect.repository.TransactionRepository;
import com.agroconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AccountService {

    private static final Logger log = LoggerFactory.getLogger(AccountService.class);
    private static final Set<RequestStatus> TERMINAL_STATUSES = Set.of(
            RequestStatus.COMPLETED, RequestStatus.RATED, RequestStatus.EXPIRED, RequestStatus.CANCELLED
    );

    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final ProposalRepository proposalRepository;
    private final TransactionRepository transactionRepository;
    private final ReviewRepository reviewRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void deleteAccount(Long userId, String password) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilizador não encontrado."));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ValidationException("Palavra-passe incorreta.");
        }

        // Cancel non-terminal requests BEFORE soft-delete (SQLRestriction on User would filter out deleted users)
        if (user.getRole() == Role.CLIENT) {
            cancelPendingRequests(userId);
        }

        // Soft-delete and anonymize user
        user.setActive(false);
        user.setDeletedAt(Instant.now());
        user.setEmail("deleted-" + userId + "@agroconnect.local");
        userRepository.save(user);

        // Anonymize profile data
        anonymizeProfile(userId, user.getRole());

        // Revoke all refresh tokens
        refreshTokenRepository.revokeAllByUserId(userId);

        log.info("Account deleted for user {}", userId);
    }

    public DataExportResponse exportData(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilizador não encontrado."));

        UserData userData = buildUserData(userId, user);
        List<RequestData> requests = exportRequests(userId, user.getRole());
        List<ProposalData> proposals = exportProposals(userId, user.getRole());
        List<TransactionData> transactions = exportTransactions(userId);
        List<ReviewData> reviews = exportReviews(userId);
        List<MessageData> messages = exportMessages(userId);
        List<NotificationData> notifications = exportNotifications(userId);

        return new DataExportResponse(userData, requests, proposals, transactions,
                reviews, messages, notifications, Instant.now());
    }

    private void anonymizeProfile(Long userId, Role role) {
        if (role == Role.CLIENT) {
            clientProfileRepository.findByUserId(userId).ifPresent(profile -> {
                profile.setName("Utilizador Eliminado");
                profile.setPhone(null);
                profile.setLocation(null);
                profile.setParish(null);
                profile.setMunicipality(null);
                profile.setIsland(null);
                profile.setProfilePhotoUrl(null);
                profile.setBio(null);
                clientProfileRepository.save(profile);
            });
        } else {
            providerProfileRepository.findByUserId(userId).ifPresent(profile -> {
                profile.setCompanyName("Prestador Eliminado");
                profile.setNif("000000000");
                profile.setPhone(null);
                profile.setLocation(null);
                profile.setParish(null);
                profile.setMunicipality(null);
                profile.setIsland(null);
                profile.setProfilePhotoUrl(null);
                profile.setBio(null);
                providerProfileRepository.save(profile);
            });
        }
    }

    private void cancelPendingRequests(Long clientId) {
        List<ServiceRequest> requests = serviceRequestRepository.findByClientId(clientId);
        for (ServiceRequest request : requests) {
            if (!TERMINAL_STATUSES.contains(request.getStatus())) {
                request.setStatus(RequestStatus.CANCELLED);
                serviceRequestRepository.save(request);
            }
        }
    }

    private UserData buildUserData(Long userId, User user) {
        String name = null;
        String phone = null;
        String parish = null;
        String municipality = null;
        String island = null;

        if (user.getRole() == Role.CLIENT) {
            var profile = clientProfileRepository.findByUserId(userId);
            if (profile.isPresent()) {
                var p = profile.get();
                name = p.getName();
                phone = p.getPhone();
                parish = p.getParish();
                municipality = p.getMunicipality();
                island = p.getIsland();
            }
        } else {
            var profile = providerProfileRepository.findByUserId(userId);
            if (profile.isPresent()) {
                var p = profile.get();
                name = p.getCompanyName();
                phone = p.getPhone();
                parish = p.getParish();
                municipality = p.getMunicipality();
                island = p.getIsland();
            }
        }

        return new UserData(user.getEmail(), name, phone, user.getRole().name(),
                parish, municipality, island, user.getCreatedAt());
    }

    private List<RequestData> exportRequests(Long userId, Role role) {
        if (role != Role.CLIENT) return List.of();
        return serviceRequestRepository.findByClientId(userId).stream()
                .map(r -> new RequestData(r.getId(), r.getTitle(), r.getDescription(),
                        r.getStatus().name(), r.getCategory() != null ? r.getCategory().getName() : null,
                        r.getArea(), r.getUrgency() != null ? r.getUrgency().name() : null,
                        r.getCreatedAt()))
                .toList();
    }

    private List<ProposalData> exportProposals(Long userId, Role role) {
        if (role == Role.CLIENT) return List.of();
        var provider = providerProfileRepository.findByUserId(userId);
        if (provider.isEmpty()) return List.of();
        return proposalRepository.findByProviderIdOrderByCreatedAtDesc(provider.get().getId(),
                        Pageable.unpaged()).getContent().stream()
                .map(p -> new ProposalData(p.getId(), p.getRequest().getId(), p.getPrice(),
                        p.getStatus().name(), p.getDescription(), p.getCreatedAt()))
                .toList();
    }

    private List<TransactionData> exportTransactions(Long userId) {
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(userId,
                        Pageable.unpaged()).getContent().stream()
                .map(t -> new TransactionData(t.getId(), t.getAmount(), t.getCommissionAmount(),
                        t.getProviderPayout(), t.getStatus().name(), t.getCreatedAt()))
                .toList();
    }

    private List<ReviewData> exportReviews(Long userId) {
        return reviewRepository.findByAuthorId(userId).stream()
                .map(r -> new ReviewData(r.getId(), r.getRequest().getId(), r.getRating(),
                        r.getComment(), r.getCreatedAt()))
                .toList();
    }

    private List<MessageData> exportMessages(Long userId) {
        return chatMessageRepository.findBySenderId(userId).stream()
                .map(m -> new MessageData(m.getId(), m.getRequest().getId(), m.getContent(),
                        m.getSentAt()))
                .toList();
    }

    private List<NotificationData> exportNotifications(Long userId) {
        return notificationRepository.findByUserId(userId).stream()
                .map(n -> new NotificationData(n.getId(), n.getTitle(), n.getBody(),
                        n.getType(), n.isRead(), n.getCreatedAt()))
                .toList();
    }
}
