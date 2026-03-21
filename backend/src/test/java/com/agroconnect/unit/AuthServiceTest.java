package com.agroconnect.unit;

import com.agroconnect.config.SecurityProperties;
import com.agroconnect.dto.request.LoginRequest;
import com.agroconnect.dto.request.RefreshTokenRequest;
import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.dto.request.ResetPasswordRequest;
import com.agroconnect.dto.response.AuthResponse;
import com.agroconnect.dto.response.MessageResponse;
import com.agroconnect.exception.DuplicateEmailException;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.exception.ValidationException;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.EmailVerificationToken;
import com.agroconnect.model.RefreshToken;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.Role;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.EmailVerificationTokenRepository;
import com.agroconnect.repository.PasswordResetTokenRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.RefreshTokenRepository;
import com.agroconnect.repository.UserRepository;
import com.agroconnect.security.JwtService;
import com.agroconnect.service.AuthService;
import com.agroconnect.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private ClientProfileRepository clientProfileRepository;
    @Mock
    private ProviderProfileRepository providerProfileRepository;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private EmailVerificationTokenRepository emailVerificationTokenRepository;
    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtService jwtService;
    @Mock
    private EmailService emailService;
    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOps;

    private SecurityProperties securityProperties;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        securityProperties = new SecurityProperties(5, 15, 24, 60);
        authService = new AuthService(
                userRepository,
                clientProfileRepository,
                providerProfileRepository,
                refreshTokenRepository,
                emailVerificationTokenRepository,
                passwordResetTokenRepository,
                passwordEncoder,
                authenticationManager,
                jwtService,
                emailService,
                securityProperties,
                redisTemplate
        );
    }

    @Test
    void register_givenValidClientData_shouldReturnMessageResponseAndSendVerificationEmail() {
        RegisterRequest request = new RegisterRequest(
                "joao@example.pt", "Password1", "Password1",
                "João Silva", "+351912345678", "CLIENT", null, null);

        User savedUser = UserFixture.aClientUser().build();

        when(userRepository.existsByEmail("joao@example.pt")).thenReturn(false);
        when(passwordEncoder.encode("Password1")).thenReturn("$2a$12$encoded");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(clientProfileRepository.save(any(ClientProfile.class)))
                .thenReturn(UserFixture.aClientProfile().user(savedUser).build());
        when(jwtService.hashToken(anyString())).thenReturn("hashed-verification-token");
        when(emailVerificationTokenRepository.save(any(EmailVerificationToken.class)))
                .thenReturn(EmailVerificationToken.builder().build());

        MessageResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("Registo efetuado. Verifique o seu email.", response.message());
        verify(emailService).sendVerificationEmail(eq("joao.silva@email.pt"), anyString(), anyString());
        verify(emailVerificationTokenRepository).save(any(EmailVerificationToken.class));
    }

    @Test
    void register_givenDuplicateEmail_shouldThrowDuplicateEmailException() {
        RegisterRequest request = new RegisterRequest(
                "existing@example.pt", "Password1", "Password1",
                "Test", null, "CLIENT", null, null);

        when(userRepository.existsByEmail("existing@example.pt")).thenReturn(true);

        assertThrows(DuplicateEmailException.class, () -> authService.register(request));
    }

    @Test
    void register_givenMismatchedPasswords_shouldThrowValidationException() {
        RegisterRequest request = new RegisterRequest(
                "test@example.pt", "Password1", "different",
                "Test", null, "CLIENT", null, null);

        assertThrows(ValidationException.class, () -> authService.register(request));
    }

    @Test
    void register_givenProviderWithoutCompanyName_shouldThrowValidationException() {
        RegisterRequest request = new RegisterRequest(
                "provider@example.pt", "Password1", "Password1",
                "Provider", null, "PROVIDER_MANAGER", null, "123456789");

        User savedUser = UserFixture.aProviderUser().build();
        when(userRepository.existsByEmail("provider@example.pt")).thenReturn(false);
        when(passwordEncoder.encode("Password1")).thenReturn("$2a$12$encoded");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        assertThrows(ValidationException.class, () -> authService.register(request));
    }

    @Test
    void login_givenValidCredentials_shouldReturnAuthResponse() {
        LoginRequest request = new LoginRequest("joao@example.pt", "Password1");
        User user = UserFixture.aClientUser().emailVerified(true).build();
        ClientProfile profile = UserFixture.aClientProfile().user(user).build();

        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("bf:127.0.0.1:joao@example.pt")).thenReturn(null);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken("joao@example.pt", null));
        when(userRepository.findByEmail("joao@example.pt")).thenReturn(Optional.of(user));
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(jwtService.generateAccessToken(user)).thenReturn("access-token");
        when(jwtService.generateRefreshToken(user)).thenReturn("refresh-token");
        when(jwtService.getAccessTokenExpiration()).thenReturn(900000L);

        AuthResponse response = authService.login(request, "127.0.0.1");

        assertNotNull(response);
        assertEquals("access-token", response.accessToken());
    }

    @Test
    void login_givenUnverifiedEmail_shouldThrowForbidden() {
        LoginRequest request = new LoginRequest("joao@example.pt", "Password1");
        User user = UserFixture.aClientUser().emailVerified(false).build();

        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("bf:127.0.0.1:joao@example.pt")).thenReturn(null);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken("joao@example.pt", null));
        when(userRepository.findByEmail("joao@example.pt")).thenReturn(Optional.of(user));

        assertThrows(ForbiddenException.class, () -> authService.login(request, "127.0.0.1"));
    }

    @Test
    void login_givenWrongPassword_shouldThrowBadCredentials() {
        LoginRequest request = new LoginRequest("joao@example.pt", "wrong");

        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("bf:127.0.0.1:joao@example.pt")).thenReturn(null);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThrows(BadCredentialsException.class, () -> authService.login(request, "127.0.0.1"));
        verify(valueOps).increment("bf:127.0.0.1:joao@example.pt");
    }

    @Test
    void refreshToken_givenValidToken_shouldReturnNewAuthResponse() {
        RefreshTokenRequest request = new RefreshTokenRequest("raw-token");

        User user = UserFixture.aClientUser().build();
        ClientProfile profile = UserFixture.aClientProfile().user(user).build();
        RefreshToken storedToken = UserFixture.aRefreshToken().user(user).build();

        when(jwtService.hashToken("raw-token")).thenReturn("hashed-token");
        when(refreshTokenRepository.findByTokenHash("hashed-token")).thenReturn(Optional.of(storedToken));
        when(refreshTokenRepository.save(storedToken)).thenReturn(storedToken);
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(jwtService.generateAccessToken(user)).thenReturn("new-access-token");
        when(jwtService.generateRefreshToken(user)).thenReturn("new-refresh-token");
        when(jwtService.getAccessTokenExpiration()).thenReturn(900000L);

        AuthResponse response = authService.refreshToken(request);

        assertNotNull(response);
        assertEquals("new-access-token", response.accessToken());
        verify(refreshTokenRepository).save(storedToken);
    }

    @Test
    void refreshToken_givenRevokedToken_shouldThrowValidationException() {
        RefreshTokenRequest request = new RefreshTokenRequest("revoked-token");

        RefreshToken storedToken = UserFixture.aRefreshToken()
                .user(UserFixture.aClientUser().build())
                .revoked(true)
                .build();

        when(jwtService.hashToken("revoked-token")).thenReturn("hashed");
        when(refreshTokenRepository.findByTokenHash("hashed")).thenReturn(Optional.of(storedToken));

        assertThrows(ValidationException.class, () -> authService.refreshToken(request));
    }

    @Test
    void refreshToken_givenExpiredToken_shouldThrowValidationException() {
        RefreshTokenRequest request = new RefreshTokenRequest("expired-token");

        RefreshToken storedToken = UserFixture.aRefreshToken()
                .user(UserFixture.aClientUser().build())
                .expiresAt(Instant.now().minusSeconds(3600))
                .build();

        when(jwtService.hashToken("expired-token")).thenReturn("hashed");
        when(refreshTokenRepository.findByTokenHash("hashed")).thenReturn(Optional.of(storedToken));

        assertThrows(ValidationException.class, () -> authService.refreshToken(request));
    }

    @Test
    void logout_shouldRevokeAllTokensForUser() {
        authService.logout(1L);

        verify(refreshTokenRepository).revokeAllByUserId(1L);
    }

    @Test
    void verifyEmail_givenValidToken_shouldVerifyUser() {
        User user = UserFixture.aClientUser().emailVerified(false).build();
        EmailVerificationToken token = EmailVerificationToken.builder()
                .id(1L)
                .tokenHash("hashed-token")
                .user(user)
                .expiresAt(Instant.now().plusSeconds(3600))
                .usedAt(null)
                .build();

        when(jwtService.hashToken("raw-token")).thenReturn("hashed-token");
        when(emailVerificationTokenRepository.findByTokenHash("hashed-token"))
                .thenReturn(Optional.of(token));
        when(userRepository.save(user)).thenReturn(user);
        when(emailVerificationTokenRepository.save(token)).thenReturn(token);

        MessageResponse response = authService.verifyEmail("raw-token");

        assertEquals("Email verificado com sucesso.", response.message());
        verify(userRepository).save(user);
        verify(emailVerificationTokenRepository).save(token);
    }

    @Test
    void verifyEmail_givenAlreadyVerifiedUser_shouldReturnSuccess() {
        User user = UserFixture.aClientUser().emailVerified(true).build();
        EmailVerificationToken token = EmailVerificationToken.builder()
                .id(1L)
                .tokenHash("hashed-token")
                .user(user)
                .expiresAt(Instant.now().plusSeconds(3600))
                .usedAt(null)
                .build();

        when(jwtService.hashToken("raw-token")).thenReturn("hashed-token");
        when(emailVerificationTokenRepository.findByTokenHash("hashed-token"))
                .thenReturn(Optional.of(token));

        MessageResponse response = authService.verifyEmail("raw-token");

        assertEquals("Email verificado com sucesso.", response.message());
        verify(userRepository, never()).save(any());
    }

    @Test
    void forgotPassword_givenNonExistentEmail_shouldStillReturn200() {
        when(userRepository.findByEmail("nonexistent@example.pt")).thenReturn(Optional.empty());

        MessageResponse response = authService.forgotPassword("nonexistent@example.pt");

        assertNotNull(response);
        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString(), anyString());
    }

    @Test
    void resetPassword_givenValidToken_shouldChangePassword() {
        ResetPasswordRequest request = new ResetPasswordRequest("raw-token", "NewPassword1");
        User user = UserFixture.aClientUser().emailVerified(true).build();
        com.agroconnect.model.PasswordResetToken resetToken = com.agroconnect.model.PasswordResetToken.builder()
                .id(1L)
                .tokenHash("hashed-token")
                .user(user)
                .expiresAt(Instant.now().plusSeconds(3600))
                .usedAt(null)
                .build();

        when(jwtService.hashToken("raw-token")).thenReturn("hashed-token");
        when(passwordResetTokenRepository.findByTokenHash("hashed-token"))
                .thenReturn(Optional.of(resetToken));
        when(passwordEncoder.encode("NewPassword1")).thenReturn("$2a$12$newEncoded");
        when(userRepository.save(user)).thenReturn(user);
        when(passwordResetTokenRepository.save(resetToken)).thenReturn(resetToken);

        MessageResponse response = authService.resetPassword(request);

        assertEquals("Palavra-passe redefinida com sucesso.", response.message());
        verify(passwordEncoder).encode("NewPassword1");
        verify(refreshTokenRepository).revokeAllByUserId(1L);
    }
}
