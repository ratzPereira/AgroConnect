package com.agroconnect.service;

import com.agroconnect.dto.request.LoginRequest;
import com.agroconnect.dto.request.RefreshTokenRequest;
import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.dto.response.AuthResponse;
import com.agroconnect.dto.response.UserResponse;
import com.agroconnect.exception.DuplicateEmailException;
import com.agroconnect.exception.ValidationException;
import com.agroconnect.mapper.UserMapper;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.RefreshToken;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.Role;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.RefreshTokenRepository;
import com.agroconnect.repository.UserRepository;
import com.agroconnect.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
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

        log.info("New user registered: {} ({})", user.getEmail(), role);

        return buildAuthResponse(user, displayName);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Email ou palavra-passe incorretos."));

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
