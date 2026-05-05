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
import com.agroconnect.exception.TooManyAttemptsException;
import com.agroconnect.exception.ValidationException;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.EmailVerificationToken;
import com.agroconnect.model.PasswordResetToken;
import com.agroconnect.model.ProviderProfile;
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
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private ClientProfileRepository clientProfileRepository;
    @Mock private ProviderProfileRepository providerProfileRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private EmailVerificationTokenRepository emailVerificationTokenRepository;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtService jwtService;
    @Mock private EmailService emailService;
    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;

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

    // --- register ---

    @Test
    void register_givenValidData_shouldCreateUser() {
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
        verify(userRepository).save(any(User.class));
        verify(clientProfileRepository).save(any(ClientProfile.class));
        verify(emailService).sendVerificationEmail(eq("joao.silva@email.pt"), anyString(), anyString());
        verify(emailVerificationTokenRepository).save(any(EmailVerificationToken.class));
    }

    @Test
    void register_givenExistingEmail_shouldThrowConflict() {
        RegisterRequest request = new RegisterRequest(
                "existing@example.pt", "Password1", "Password1",
                "Test", null, "CLIENT", null, null);

        when(userRepository.existsByEmail("existing@example.pt")).thenReturn(true);

        assertThrows(DuplicateEmailException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_givenMismatchedPasswords_shouldThrowValidation() {
        RegisterRequest request = new RegisterRequest(
                "test@example.pt", "Password1", "different",
                "Test", null, "CLIENT", null, null);

        assertThrows(ValidationException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_givenProviderWithoutCompanyName_shouldThrowValidation() {
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
    void register_givenProviderWithoutNif_shouldThrowValidation() {
        RegisterRequest request = new RegisterRequest(
                "provider@example.pt", "Password1", "Password1",
                "Provider", null, "PROVIDER_MANAGER", "Company Name", null);

        User savedUser = UserFixture.aProviderUser().build();
        when(userRepository.existsByEmail("provider@example.pt")).thenReturn(false);
        when(passwordEncoder.encode("Password1")).thenReturn("$2a$12$encoded");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        assertThrows(ValidationException.class, () -> authService.register(request));
    }

    @Test
    void register_givenValidProviderData_shouldCreateProviderProfile() {
        RegisterRequest request = new RegisterRequest(
                "provider@example.pt", "Password1", "Password1",
                "Provider Name", "+351912345678", "PROVIDER_MANAGER",
                "AgroTech Lda", "123456789");

        User savedUser = UserFixture.aProviderUser().email("provider@example.pt").build();

        when(userRepository.existsByEmail("provider@example.pt")).thenReturn(false);
        when(passwordEncoder.encode("Password1")).thenReturn("$2a$12$encoded");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(providerProfileRepository.save(any(ProviderProfile.class)))
                .thenReturn(UserFixture.aProviderProfile().user(savedUser).build());
        when(jwtService.hashToken(anyString())).thenReturn("hashed");
        when(emailVerificationTokenRepository.save(any(EmailVerificationToken.class)))
                .thenReturn(EmailVerificationToken.builder().build());

        MessageResponse response = authService.register(request);

        assertNotNull(response);
        verify(providerProfileRepository).save(any(ProviderProfile.class));
        verify(clientProfileRepository, never()).save(any());
    }

    // --- login ---

    @Test
    void login_givenValidCredentials_shouldReturnTokens() {
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
        assertEquals("refresh-token", response.refreshToken());
        assertEquals(900000L, response.expiresIn());
        assertNotNull(response.user());
        verify(redisTemplate).delete("bf:127.0.0.1:joao@example.pt");
    }

    @Test
    void login_givenInvalidPassword_shouldThrowBadCredentials() {
        LoginRequest request = new LoginRequest("joao@example.pt", "wrong");

        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("bf:127.0.0.1:joao@example.pt")).thenReturn(null);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThrows(BadCredentialsException.class, () -> authService.login(request, "127.0.0.1"));
        verify(valueOps).increment("bf:127.0.0.1:joao@example.pt");
    }

    @Test
    void login_givenNonExistingEmail_shouldThrowBadCredentials() {
        LoginRequest request = new LoginRequest("nonexistent@example.pt", "Password1");

        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("bf:127.0.0.1:nonexistent@example.pt")).thenReturn(null);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThrows(BadCredentialsException.class, () -> authService.login(request, "127.0.0.1"));
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
    void login_givenInactiveAccount_shouldThrowForbidden() {
        LoginRequest request = new LoginRequest("joao@example.pt", "Password1");
        User user = UserFixture.aClientUser().emailVerified(true).active(false).build();

        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("bf:127.0.0.1:joao@example.pt")).thenReturn(null);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken("joao@example.pt", null));
        when(userRepository.findByEmail("joao@example.pt")).thenReturn(Optional.of(user));

        assertThrows(ForbiddenException.class, () -> authService.login(request, "127.0.0.1"));
    }

    @Test
    void login_givenTooManyAttempts_shouldThrowTooManyAttempts() {
        LoginRequest request = new LoginRequest("joao@example.pt", "Password1");

        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("bf:127.0.0.1:joao@example.pt")).thenReturn("5");

        assertThrows(TooManyAttemptsException.class, () -> authService.login(request, "127.0.0.1"));
        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    void login_givenProviderUser_shouldReturnProviderDisplayName() {
        LoginRequest request = new LoginRequest("provider@example.pt", "Password1");
        User user = UserFixture.aProviderUser().email("provider@example.pt").emailVerified(true).build();
        ProviderProfile profile = UserFixture.aProviderProfile().user(user).build();

        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("bf:127.0.0.1:provider@example.pt")).thenReturn(null);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken("provider@example.pt", null));
        when(userRepository.findByEmail("provider@example.pt")).thenReturn(Optional.of(user));
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(profile));
        when(jwtService.generateAccessToken(user)).thenReturn("access-token");
        when(jwtService.generateRefreshToken(user)).thenReturn("refresh-token");
        when(jwtService.getAccessTokenExpiration()).thenReturn(900000L);

        AuthResponse response = authService.login(request, "127.0.0.1");

        assertNotNull(response);
        assertEquals("AgroServiços Terceira", response.user().name());
    }

    // --- refreshToken ---

    @Test
    void refreshToken_givenValidToken_shouldReturnNewAccessToken() {
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
        assertEquals("new-refresh-token", response.refreshToken());
        assertTrue(storedToken.isRevoked());
        verify(refreshTokenRepository).save(storedToken);
    }

    @Test
    void refreshToken_givenExpiredToken_shouldThrowValidation() {
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
    void refreshToken_givenRevokedToken_shouldThrowValidation() {
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
    void refreshToken_givenInvalidToken_shouldThrowValidation() {
        RefreshTokenRequest request = new RefreshTokenRequest("unknown-token");

        when(jwtService.hashToken("unknown-token")).thenReturn("hashed");
        when(refreshTokenRepository.findByTokenHash("hashed")).thenReturn(Optional.empty());

        assertThrows(ValidationException.class, () -> authService.refreshToken(request));
    }

    // --- logout ---

    @Test
    void logout_shouldRevokeAllTokensForUser() {
        authService.logout(1L);

        verify(refreshTokenRepository).revokeAllByUserId(1L);
    }

    // --- verifyEmail ---

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
        assertTrue(user.isEmailVerified());
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
    void verifyEmail_givenExpiredToken_shouldThrowValidation() {
        User user = UserFixture.aClientUser().emailVerified(false).build();
        EmailVerificationToken token = EmailVerificationToken.builder()
                .id(1L)
                .tokenHash("hashed-token")
                .user(user)
                .expiresAt(Instant.now().minusSeconds(3600))
                .usedAt(null)
                .build();

        when(jwtService.hashToken("raw-token")).thenReturn("hashed-token");
        when(emailVerificationTokenRepository.findByTokenHash("hashed-token"))
                .thenReturn(Optional.of(token));

        assertThrows(ValidationException.class, () -> authService.verifyEmail("raw-token"));
    }

    @Test
    void verifyEmail_givenUsedToken_shouldThrowValidation() {
        User user = UserFixture.aClientUser().emailVerified(false).build();
        EmailVerificationToken token = EmailVerificationToken.builder()
                .id(1L)
                .tokenHash("hashed-token")
                .user(user)
                .expiresAt(Instant.now().plusSeconds(3600))
                .usedAt(Instant.now().minusSeconds(60))
                .build();

        when(jwtService.hashToken("raw-token")).thenReturn("hashed-token");
        when(emailVerificationTokenRepository.findByTokenHash("hashed-token"))
                .thenReturn(Optional.of(token));

        assertThrows(ValidationException.class, () -> authService.verifyEmail("raw-token"));
    }

    @Test
    void verifyEmail_givenInvalidToken_shouldThrowNotFound() {
        when(jwtService.hashToken("bad-token")).thenReturn("bad-hash");
        when(emailVerificationTokenRepository.findByTokenHash("bad-hash"))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> authService.verifyEmail("bad-token"));
    }

    // --- forgotPassword ---

    @Test
    void forgotPassword_givenNonExistentEmail_shouldReturnSuccessForAntiEnumeration() {
        when(userRepository.findByEmail("nonexistent@example.pt")).thenReturn(Optional.empty());

        MessageResponse response = authService.forgotPassword("nonexistent@example.pt");

        assertNotNull(response);
        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString(), anyString());
    }

    @Test
    void forgotPassword_givenVerifiedUser_shouldSendResetEmail() {
        User user = UserFixture.aClientUser().emailVerified(true).build();
        ClientProfile profile = UserFixture.aClientProfile().user(user).build();

        when(userRepository.findByEmail("joao.silva@email.pt")).thenReturn(Optional.of(user));
        when(jwtService.hashToken(anyString())).thenReturn("hashed");
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class)))
                .thenReturn(PasswordResetToken.builder().build());
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));

        MessageResponse response = authService.forgotPassword("joao.silva@email.pt");

        assertNotNull(response);
        verify(emailService).sendPasswordResetEmail(eq("joao.silva@email.pt"), anyString(), anyString());
    }

    @Test
    void forgotPassword_givenUnverifiedUser_shouldNotSendEmail() {
        User user = UserFixture.aClientUser().emailVerified(false).build();

        when(userRepository.findByEmail("joao.silva@email.pt")).thenReturn(Optional.of(user));

        MessageResponse response = authService.forgotPassword("joao.silva@email.pt");

        assertNotNull(response);
        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString(), anyString());
    }

    // --- resetPassword ---

    @Test
    void resetPassword_givenValidToken_shouldChangePassword() {
        ResetPasswordRequest request = new ResetPasswordRequest("raw-token", "NewPassword1");
        User user = UserFixture.aClientUser().emailVerified(true).build();
        PasswordResetToken resetToken = PasswordResetToken.builder()
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
        assertNotNull(resetToken.getUsedAt());
    }

    @Test
    void resetPassword_givenExpiredToken_shouldThrowValidation() {
        ResetPasswordRequest request = new ResetPasswordRequest("raw-token", "NewPassword1");
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .id(1L)
                .tokenHash("hashed-token")
                .user(UserFixture.aClientUser().build())
                .expiresAt(Instant.now().minusSeconds(3600))
                .usedAt(null)
                .build();

        when(jwtService.hashToken("raw-token")).thenReturn("hashed-token");
        when(passwordResetTokenRepository.findByTokenHash("hashed-token"))
                .thenReturn(Optional.of(resetToken));

        assertThrows(ValidationException.class, () -> authService.resetPassword(request));
    }

    @Test
    void resetPassword_givenUsedToken_shouldThrowValidation() {
        ResetPasswordRequest request = new ResetPasswordRequest("raw-token", "NewPassword1");
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .id(1L)
                .tokenHash("hashed-token")
                .user(UserFixture.aClientUser().build())
                .expiresAt(Instant.now().plusSeconds(3600))
                .usedAt(Instant.now().minusSeconds(60))
                .build();

        when(jwtService.hashToken("raw-token")).thenReturn("hashed-token");
        when(passwordResetTokenRepository.findByTokenHash("hashed-token"))
                .thenReturn(Optional.of(resetToken));

        assertThrows(ValidationException.class, () -> authService.resetPassword(request));
    }

    @Test
    void resetPassword_givenInvalidToken_shouldThrowNotFound() {
        ResetPasswordRequest request = new ResetPasswordRequest("bad-token", "NewPassword1");

        when(jwtService.hashToken("bad-token")).thenReturn("bad-hash");
        when(passwordResetTokenRepository.findByTokenHash("bad-hash"))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> authService.resetPassword(request));
    }

    // --- resendVerification ---

    @Test
    void resendVerification_givenExistingUnverifiedUser_shouldSendEmail() {
        User user = UserFixture.aClientUser().emailVerified(false).build();
        ClientProfile profile = UserFixture.aClientProfile().user(user).build();

        when(userRepository.findByEmail("joao.silva@email.pt")).thenReturn(Optional.of(user));
        when(jwtService.hashToken(anyString())).thenReturn("hashed");
        when(emailVerificationTokenRepository.save(any(EmailVerificationToken.class)))
                .thenReturn(EmailVerificationToken.builder().build());
        when(clientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));

        MessageResponse response = authService.resendVerification("joao.silva@email.pt");

        assertNotNull(response);
        verify(emailService).sendVerificationEmail(eq("joao.silva@email.pt"), anyString(), anyString());
        verify(emailVerificationTokenRepository).deleteByUserIdAndUsedAtIsNull(1L);
    }

    @Test
    void resendVerification_givenAlreadyVerifiedUser_shouldReturnSuccessWithoutSending() {
        User user = UserFixture.aClientUser().emailVerified(true).build();

        when(userRepository.findByEmail("joao.silva@email.pt")).thenReturn(Optional.of(user));

        MessageResponse response = authService.resendVerification("joao.silva@email.pt");

        assertNotNull(response);
        verify(emailService, never()).sendVerificationEmail(anyString(), anyString(), anyString());
    }

    @Test
    void resendVerification_givenNonExistentEmail_shouldReturnSuccessForAntiEnumeration() {
        when(userRepository.findByEmail("unknown@example.pt")).thenReturn(Optional.empty());

        MessageResponse response = authService.resendVerification("unknown@example.pt");

        assertNotNull(response);
        verify(emailService, never()).sendVerificationEmail(anyString(), anyString(), anyString());
    }
}
