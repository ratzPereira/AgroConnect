package com.agroconnect.unit;

import com.agroconnect.dto.response.DataExportResponse;
import com.agroconnect.exception.ValidationException;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.User;
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

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
    void exportData_shouldReturnAllSections() {
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
        assertThat(result.exportedAt()).isNotNull();
        assertThat(result.requests()).isEmpty();
        assertThat(result.reviews()).isEmpty();
    }
}
