package com.agroconnect.service;

import com.agroconnect.config.SecurityProperties;
import com.agroconnect.dto.request.LoginRequest;
import com.agroconnect.dto.request.RefreshTokenRequest;
import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.dto.request.ResetPasswordRequest;
import com.agroconnect.dto.response.AuthResponse;
import com.agroconnect.dto.response.MessageResponse;
import com.agroconnect.dto.response.UserResponse;
import com.agroconnect.exception.DuplicateEmailException;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.exception.TooManyAttemptsException;
import com.agroconnect.exception.ValidationException;
import com.agroconnect.mapper.UserMapper;
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
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final SecurityProperties securityProperties;
    private final StringRedisTemplate redisTemplate;

    @Transactional
    public MessageResponse register(RegisterRequest request) {
        if (!request.password().equals(request.confirmPassword())) {
            throw new ValidationException("As palavras-passe não coincidem.");
        }

        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateEmailException(request.email());
        }

        Role role = Role.valueOf(request.role());

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(role)
                .build();
        user = userRepository.save(user);

        String displayName = createProfile(user, request, role);

        String rawToken = UUID.randomUUID().toString();
        String hash = jwtService.hashToken(rawToken);

        Instant expiresAt = Instant.now()
                .plusSeconds((long) securityProperties.emailVerificationExpiryHours() * 3600);

        EmailVerificationToken verificationToken = EmailVerificationToken.builder()
                .tokenHash(hash)
                .user(user)
                .expiresAt(expiresAt)
                .build();
        emailVerificationTokenRepository.save(verificationToken);

        emailService.sendVerificationEmail(user.getEmail(), displayName, rawToken);

        log.info("New user registered: {} ({})", user.getEmail(), role);

        return new MessageResponse("Registo efetuado. Verifique o seu email.");
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String clientIp) {
        String bruteForceKey = "bf:" + clientIp + ":" + request.email();

        String attempts = redisTemplate.opsForValue().get(bruteForceKey);
        if (attempts != null && Integer.parseInt(attempts) >= securityProperties.bruteForceMaxAttempts()) {
            throw new TooManyAttemptsException(
                    "Conta temporariamente bloqueada. Tente novamente mais tarde.");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        } catch (BadCredentialsException ex) {
            redisTemplate.opsForValue().increment(bruteForceKey);
            redisTemplate.expire(bruteForceKey,
                    securityProperties.bruteForceLockoutMinutes(), TimeUnit.MINUTES);
            throw ex;
        }

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Email ou palavra-passe incorretos."));

        if (!user.isEmailVerified()) {
            throw new ForbiddenException("Verifique o seu email antes de iniciar sessão.");
        }

        if (!user.isActive()) {
            throw new ForbiddenException("A sua conta foi suspensa.");
        }

        redisTemplate.delete(bruteForceKey);

        String displayName = getDisplayName(user);

        log.info("User logged in: {}", user.getEmail());

        return buildAuthResponse(user, displayName);
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String tokenHash = jwtService.hashToken(request.refreshToken());

        RefreshToken storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ValidationException("Refresh token inválido."));

        if (storedToken.isRevoked()) {
            throw new ValidationException("Refresh token revogado.");
        }

        if (storedToken.getExpiresAt().isBefore(Instant.now())) {
            throw new ValidationException("Refresh token expirado.");
        }

        // Rotate: revoke old, issue new
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        User user = storedToken.getUser();
        String displayName = getDisplayName(user);

        log.info("Token refreshed for user: {}", user.getEmail());

        return buildAuthResponse(user, displayName);
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
        log.info("All refresh tokens revoked for user ID: {}", userId);
    }

    @Transactional
    public MessageResponse verifyEmail(String rawToken) {
        String hash = jwtService.hashToken(rawToken);
        EmailVerificationToken token = emailVerificationTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new ResourceNotFoundException("Token de verificação inválido."));
        User user = token.getUser();
        if (user.isEmailVerified()) {
            return new MessageResponse("Email verificado com sucesso.");
        }
        if (token.getUsedAt() != null) {
            throw new ValidationException("Este token já foi utilizado.");
        }
        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new ValidationException("Este token expirou. Solicite um novo link de verificação.");
        }
        user.setEmailVerified(true);
        userRepository.save(user);
        token.setUsedAt(Instant.now());
        emailVerificationTokenRepository.save(token);
        log.info("Email verified for user: {}", user.getEmail());
        return new MessageResponse("Email verificado com sucesso.");
    }

    @Transactional
    public MessageResponse resendVerification(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty() || userOpt.get().isEmailVerified()) {
            // Anti-enumeration: always return success
            return new MessageResponse("Se a conta existir e não estiver verificada, será enviado um email.");
        }

        User user = userOpt.get();
        emailVerificationTokenRepository.deleteByUserIdAndUsedAtIsNull(user.getId());

        String rawToken = UUID.randomUUID().toString();
        String hash = jwtService.hashToken(rawToken);
        Instant expiresAt = Instant.now()
                .plusSeconds((long) securityProperties.emailVerificationExpiryHours() * 3600);

        EmailVerificationToken verificationToken = EmailVerificationToken.builder()
                .tokenHash(hash)
                .user(user)
                .expiresAt(expiresAt)
                .build();
        emailVerificationTokenRepository.save(verificationToken);

        String displayName = getDisplayName(user);
        emailService.sendVerificationEmail(user.getEmail(), displayName, rawToken);

        log.info("Verification email resent to: {}", user.getEmail());
        return new MessageResponse("Se a conta existir e não estiver verificada, será enviado um email.");
    }

    @Transactional
    public MessageResponse forgotPassword(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty() || !userOpt.get().isEmailVerified()) {
            // Anti-enumeration: always return success
            return new MessageResponse("Se a conta existir e estiver verificada, será enviado um email.");
        }

        User user = userOpt.get();
        passwordResetTokenRepository.deleteByUserIdAndUsedAtIsNull(user.getId());

        String rawToken = UUID.randomUUID().toString();
        String hash = jwtService.hashToken(rawToken);
        Instant expiresAt = Instant.now()
                .plusSeconds((long) securityProperties.passwordResetExpiryMinutes() * 60);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .tokenHash(hash)
                .user(user)
                .expiresAt(expiresAt)
                .build();
        passwordResetTokenRepository.save(resetToken);

        String displayName = getDisplayName(user);
        emailService.sendPasswordResetEmail(user.getEmail(), displayName, rawToken);

        log.info("Password reset email sent to: {}", user.getEmail());
        return new MessageResponse("Se a conta existir e estiver verificada, será enviado um email.");
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        String hash = jwtService.hashToken(request.token());
        PasswordResetToken token = passwordResetTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new ResourceNotFoundException("Token de redefinição inválido."));

        if (token.getUsedAt() != null) {
            throw new ValidationException("Este token já foi utilizado.");
        }
        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new ValidationException("Este token expirou. Solicite um novo link de redefinição.");
        }

        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        token.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(token);

        refreshTokenRepository.revokeAllByUserId(user.getId());

        log.info("Password reset completed for user: {}", user.getEmail());
        return new MessageResponse("Palavra-passe redefinida com sucesso.");
    }

    private String createProfile(User user, RegisterRequest request, Role role) {
        if (role == Role.CLIENT) {
            ClientProfile profile = ClientProfile.builder()
                    .user(user)
                    .name(request.name())
                    .phone(request.phone())
                    .build();
            clientProfileRepository.save(profile);
            return request.name();
        } else {
            if (request.companyName() == null || request.companyName().isBlank()) {
                throw new ValidationException("O nome da empresa é obrigatório para prestadores.");
            }
            if (request.nif() == null || request.nif().isBlank()) {
                throw new ValidationException("O NIF é obrigatório para prestadores.");
            }
            ProviderProfile profile = ProviderProfile.builder()
                    .user(user)
                    .companyName(request.companyName())
                    .nif(request.nif())
                    .phone(request.phone())
                    .build();
            providerProfileRepository.save(profile);
            return request.companyName();
        }
    }

    private String getDisplayName(User user) {
        return switch (user.getRole()) {
            case CLIENT -> clientProfileRepository.findByUserId(user.getId())
                    .map(ClientProfile::getName)
                    .orElse(user.getEmail());
            case PROVIDER_MANAGER, PROVIDER_LEAD, PROVIDER_OPERATOR ->
                    providerProfileRepository.findByUserId(user.getId())
                            .map(ProviderProfile::getCompanyName)
                            .orElse(user.getEmail());
            case ADMIN -> "Administrador";
        };
    }

    private AuthResponse buildAuthResponse(User user, String displayName) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        UserResponse userResponse = UserMapper.toResponse(user, displayName);
        return new AuthResponse(accessToken, refreshToken, jwtService.getAccessTokenExpiration(), userResponse);
    }
}
