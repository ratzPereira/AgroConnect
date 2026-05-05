package com.agroconnect.unit;

import com.agroconnect.dto.response.DataExportResponse;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.exception.ValidationException;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.ChatMessage;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.Notification;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.Review;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.model.enums.Role;
import com.agroconnect.fixture.ServiceRequestFixture;
import com.agroconnect.fixture.ReviewFixture;
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
import com.agroconnect.service.AccountService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private ClientProfileRepository clientProfileRepository;
    @Mock private ProviderProfileRepository providerProfileRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private ServiceRequestRepository serviceRequestRepository;
    @Mock private ProposalRepository proposalRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private ChatMessageRepository chatMessageRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private PasswordEncoder passwordEncoder;

    private AccountService accountService;

    @BeforeEach
    void setUp() {
        accountService = new AccountService(userRepository, clientProfileRepository,
                providerProfileRepository, refreshTokenRepository, serviceRequestRepository,
                proposalRepository, transactionRepository, reviewRepository,
                chatMessageRepository, notificationRepository, passwordEncoder);
    }

    // --- deleteAccount ---

    @Test
    void deleteAccount_givenValidPassword_shouldSoftDeleteAndAnonymize() {
        User user = UserFixture.aClientUser().build();
        ClientProfile profile = UserFixture.aClientProfile().user(user).build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", user.getPasswordHash())).thenReturn(true);
        when(serviceRequestRepository.findByClientId(1L)).thenReturn(List.of());
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));

        accountService.deleteAccount(1L, "password123");

        assertThat(user.isActive()).isFalse();
        assertThat(user.getDeletedAt()).isNotNull();
        assertThat(user.getEmail()).isEqualTo("deleted-1@agroconnect.local");
        assertThat(profile.getName()).isEqualTo("Utilizador Eliminado");
        assertThat(profile.getPhone()).isNull();
        assertThat(profile.getLocation()).isNull();
        assertThat(profile.getParish()).isNull();
        assertThat(profile.getMunicipality()).isNull();
        assertThat(profile.getIsland()).isNull();
        assertThat(profile.getProfilePhotoUrl()).isNull();
        assertThat(profile.getBio()).isNull();
        verify(refreshTokenRepository).revokeAllByUserId(1L);
    }

    @Test
    void deleteAccount_givenInvalidPassword_shouldThrowValidationException() {
        User user = UserFixture.aClientUser().build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", user.getPasswordHash())).thenReturn(false);

        assertThatThrownBy(() -> accountService.deleteAccount(1L, "wrong"))
                .isInstanceOf(ValidationException.class)
                .hasMessage("Palavra-passe incorreta.");
    }

    @Test
    void deleteAccount_givenNonExistentUser_shouldThrowNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> accountService.deleteAccount(99L, "password"));
    }

    @Test
    void deleteAccount_shouldAnonymizePersonalData() {
        User user = UserFixture.aClientUser().build();
        ClientProfile profile = UserFixture.aClientProfile().user(user).build();
        profile.setProfilePhotoUrl("http://example.com/photo.jpg");
        profile.setBio("Some bio");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", user.getPasswordHash())).thenReturn(true);
        when(serviceRequestRepository.findByClientId(1L)).thenReturn(List.of());
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));

        accountService.deleteAccount(1L, "password123");

        assertThat(profile.getName()).isEqualTo("Utilizador Eliminado");
        assertThat(profile.getPhone()).isNull();
        assertThat(profile.getProfilePhotoUrl()).isNull();
        assertThat(profile.getBio()).isNull();
    }

    @Test
    void deleteAccount_givenProviderUser_shouldAnonymizeProviderProfile() {
        User user = UserFixture.aProviderUser().build();
        ProviderProfile profile = UserFixture.aProviderProfile().user(user).build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", user.getPasswordHash())).thenReturn(true);
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(profile));

        accountService.deleteAccount(2L, "password123");

        assertThat(user.isActive()).isFalse();
        assertThat(user.getDeletedAt()).isNotNull();
        assertThat(profile.getCompanyName()).isEqualTo("Prestador Eliminado");
        assertThat(profile.getNif()).isEqualTo("000000000");
        assertThat(profile.getPhone()).isNull();
        assertThat(profile.getLocation()).isNull();
        verify(refreshTokenRepository).revokeAllByUserId(2L);
    }

    @Test
    void deleteAccount_givenClientWithPendingRequests_shouldCancelThem() {
        User user = UserFixture.aClientUser().build();
        ClientProfile profile = UserFixture.aClientProfile().user(user).build();

        ServiceRequest publishedRequest = ServiceRequestFixture.aPublishedRequest()
                .id(1L).client(user)
                .category(ServiceRequestFixture.aCategory().build()).build();

        ServiceRequest completedRequest = ServiceRequestFixture.aRequest()
                .id(2L).status(RequestStatus.COMPLETED).client(user)
                .category(ServiceRequestFixture.aCategory().build()).build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", user.getPasswordHash())).thenReturn(true);
        when(serviceRequestRepository.findByClientId(1L)).thenReturn(List.of(publishedRequest, completedRequest));
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));

        accountService.deleteAccount(1L, "password123");

        // Published (non-terminal) should be cancelled
        assertThat(publishedRequest.getStatus()).isEqualTo(RequestStatus.CANCELLED);
        // Completed (terminal) should remain unchanged
        assertThat(completedRequest.getStatus()).isEqualTo(RequestStatus.COMPLETED);
        verify(serviceRequestRepository).save(publishedRequest);
    }

    @Test
    void deleteAccount_givenProviderUser_shouldNotCancelRequests() {
        User user = UserFixture.aProviderUser().build();
        ProviderProfile profile = UserFixture.aProviderProfile().user(user).build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", user.getPasswordHash())).thenReturn(true);
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(profile));

        accountService.deleteAccount(2L, "password123");

        // Provider users should not have their requests cancelled (only clients have requests)
        verify(serviceRequestRepository, never()).findByClientId(any());
    }

    // --- exportData ---

    @Test
    void exportData_shouldReturnUserDataAsJson() {
        User user = UserFixture.aClientUser().build();
        ClientProfile profile = UserFixture.aClientProfile().user(user).build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(serviceRequestRepository.findByClientId(1L)).thenReturn(List.of());
        when(reviewRepository.findByAuthorId(1L)).thenReturn(List.of());
        when(chatMessageRepository.findBySenderId(1L)).thenReturn(List.of());
        when(notificationRepository.findByUserId(1L)).thenReturn(List.of());
        when(transactionRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(Page.empty());

        DataExportResponse result = accountService.exportData(1L);

        assertThat(result.user()).isNotNull();
        assertThat(result.user().email()).isEqualTo("joao.silva@email.pt");
        assertThat(result.user().name()).isEqualTo("João Silva");
        assertThat(result.user().phone()).isEqualTo("+351912345678");
        assertThat(result.user().role()).isEqualTo("CLIENT");
        assertThat(result.exportedAt()).isNotNull();
        assertThat(result.requests()).isEmpty();
        assertThat(result.reviews()).isEmpty();
        assertThat(result.messages()).isEmpty();
        assertThat(result.notifications()).isEmpty();
    }

    @Test
    void exportData_givenNonExistentUser_shouldThrowNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> accountService.exportData(99L));
    }

    @Test
    void exportData_givenProviderUser_shouldReturnProviderData() {
        User user = UserFixture.aProviderUser().build();
        ProviderProfile profile = UserFixture.aProviderProfile().user(user).build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(profile));
        when(proposalRepository.findByProviderIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(Page.empty());
        when(reviewRepository.findByAuthorId(2L)).thenReturn(List.of());
        when(chatMessageRepository.findBySenderId(2L)).thenReturn(List.of());
        when(notificationRepository.findByUserId(2L)).thenReturn(List.of());
        when(transactionRepository.findByUserIdOrderByCreatedAtDesc(eq(2L), any(Pageable.class)))
                .thenReturn(Page.empty());

        DataExportResponse result = accountService.exportData(2L);

        assertThat(result.user()).isNotNull();
        assertThat(result.user().name()).isEqualTo("AgroServiços Terceira");
        assertThat(result.user().role()).isEqualTo("PROVIDER_MANAGER");
        // Provider users should have empty requests (only clients create requests)
        assertThat(result.requests()).isEmpty();
    }

    @Test
    void exportData_givenClientWithRequests_shouldIncludeRequests() {
        User user = UserFixture.aClientUser().build();
        ClientProfile profile = UserFixture.aClientProfile().user(user).build();

        ServiceRequest request = ServiceRequestFixture.aRequest()
                .id(1L).client(user)
                .category(ServiceRequestFixture.aCategory().build()).build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(serviceRequestRepository.findByClientId(1L)).thenReturn(List.of(request));
        when(reviewRepository.findByAuthorId(1L)).thenReturn(List.of());
        when(chatMessageRepository.findBySenderId(1L)).thenReturn(List.of());
        when(notificationRepository.findByUserId(1L)).thenReturn(List.of());
        when(transactionRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(Page.empty());

        DataExportResponse result = accountService.exportData(1L);

        assertThat(result.requests()).hasSize(1);
        assertThat(result.requests().get(0).title()).isEqualTo("Lavoura de 2 hectares");
    }

    @Test
    void exportData_givenUserWithReviewsAndMessages_shouldIncludeAll() {
        User user = UserFixture.aClientUser().build();
        ClientProfile profile = UserFixture.aClientProfile().user(user).build();

        ServiceRequest request = ServiceRequestFixture.aRequest()
                .id(1L).client(user)
                .category(ServiceRequestFixture.aCategory().build()).build();

        Review review = ReviewFixture.aReview().id(1L).request(request)
                .author(user).rating(5).comment("Excelente trabalho").build();

        ChatMessage message = ChatMessage.builder()
                .id(1L).request(request).sender(user)
                .content("Olá, quando pode começar?")
                .sentAt(Instant.now()).build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(serviceRequestRepository.findByClientId(1L)).thenReturn(List.of(request));
        when(reviewRepository.findByAuthorId(1L)).thenReturn(List.of(review));
        when(chatMessageRepository.findBySenderId(1L)).thenReturn(List.of(message));
        when(notificationRepository.findByUserId(1L)).thenReturn(List.of());
        when(transactionRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(Page.empty());

        DataExportResponse result = accountService.exportData(1L);

        assertThat(result.reviews()).hasSize(1);
        assertThat(result.reviews().get(0).rating()).isEqualTo(5);
        assertThat(result.messages()).hasSize(1);
        assertThat(result.messages().get(0).content()).isEqualTo("Olá, quando pode começar?");
    }

    @Test
    void exportData_givenProviderWithProposals_shouldIncludeProposals() {
        User user = UserFixture.aProviderUser().build();
        ProviderProfile profile = UserFixture.aProviderProfile().user(user).build();

        ServiceRequest request = ServiceRequestFixture.aRequest()
                .id(1L).client(UserFixture.aClientUser().build())
                .category(ServiceRequestFixture.aCategory().build()).build();

        com.agroconnect.model.Proposal proposal = com.agroconnect.model.Proposal.builder()
                .id(1L).request(request).provider(profile)
                .price(java.math.BigDecimal.valueOf(300))
                .status(com.agroconnect.model.enums.ProposalStatus.PENDING)
                .description("Proposta de serviço")
                .createdAt(Instant.now()).build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(profile));
        when(proposalRepository.findByProviderIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(proposal)));
        when(reviewRepository.findByAuthorId(2L)).thenReturn(List.of());
        when(chatMessageRepository.findBySenderId(2L)).thenReturn(List.of());
        when(notificationRepository.findByUserId(2L)).thenReturn(List.of());
        when(transactionRepository.findByUserIdOrderByCreatedAtDesc(eq(2L), any(Pageable.class)))
                .thenReturn(Page.empty());

        DataExportResponse result = accountService.exportData(2L);

        assertThat(result.proposals()).hasSize(1);
        assertThat(result.proposals().get(0).price()).isEqualByComparingTo(java.math.BigDecimal.valueOf(300));
    }

    @Test
    void deleteAccount_givenClientWithNoProfile_shouldStillSucceed() {
        User user = UserFixture.aClientUser().build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", user.getPasswordHash())).thenReturn(true);
        when(serviceRequestRepository.findByClientId(1L)).thenReturn(List.of());
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.empty());

        accountService.deleteAccount(1L, "password123");

        assertThat(user.isActive()).isFalse();
        assertThat(user.getDeletedAt()).isNotNull();
        verify(refreshTokenRepository).revokeAllByUserId(1L);
    }

    @Test
    void exportData_givenUserWithNotifications_shouldIncludeNotifications() {
        User user = UserFixture.aClientUser().build();
        ClientProfile profile = UserFixture.aClientProfile().user(user).build();

        Notification notification = Notification.builder()
                .id(1L).user(user).type("TEST").title("Notificação")
                .body("Corpo da notificação").read(false)
                .createdAt(Instant.now()).build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(serviceRequestRepository.findByClientId(1L)).thenReturn(List.of());
        when(reviewRepository.findByAuthorId(1L)).thenReturn(List.of());
        when(chatMessageRepository.findBySenderId(1L)).thenReturn(List.of());
        when(notificationRepository.findByUserId(1L)).thenReturn(List.of(notification));
        when(transactionRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(Page.empty());

        DataExportResponse result = accountService.exportData(1L);

        assertThat(result.notifications()).hasSize(1);
        assertThat(result.notifications().get(0).title()).isEqualTo("Notificação");
    }
}
