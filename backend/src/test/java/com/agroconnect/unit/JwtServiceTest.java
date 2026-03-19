package com.agroconnect.unit;

import com.agroconnect.config.JwtProperties;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.Role;
import com.agroconnect.repository.RefreshTokenRepository;
import com.agroconnect.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

    private JwtService jwtService;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        JwtProperties properties = new JwtProperties(
                "test-secret-key-that-is-at-least-256-bits-long-for-hmac-sha256",
                900000,
                604800000
        );
        jwtService = new JwtService(properties, refreshTokenRepository);

        testUser = User.builder()
                .id(1L)
                .email("test@example.pt")
                .role(Role.CLIENT)
                .build();
    }

    @Test
    void generateAccessToken_shouldReturnValidToken() {
        String token = jwtService.generateAccessToken(testUser);

        assertNotNull(token);
        assertFalse(token.isBlank());
    }

    @Test
    void extractUserId_givenValidToken_shouldReturnCorrectUserId() {
        String token = jwtService.generateAccessToken(testUser);

        Long userId = jwtService.extractUserId(token);

        assertEquals(1L, userId);
    }

    @Test
    void extractEmail_givenValidToken_shouldReturnCorrectEmail() {
        String token = jwtService.generateAccessToken(testUser);

        String email = jwtService.extractEmail(token);

        assertEquals("test@example.pt", email);
    }

    @Test
    void extractRole_givenValidToken_shouldReturnCorrectRole() {
        String token = jwtService.generateAccessToken(testUser);

        String role = jwtService.extractRole(token);

        assertEquals("CLIENT", role);
    }

    @Test
    void isTokenValid_givenValidToken_shouldReturnTrue() {
        String token = jwtService.generateAccessToken(testUser);

        assertTrue(jwtService.isTokenValid(token));
    }

    @Test
    void isTokenValid_givenInvalidToken_shouldReturnFalse() {
        assertFalse(jwtService.isTokenValid("invalid.token.here"));
    }

    @Test
    void isTokenValid_givenExpiredToken_shouldReturnFalse() {
        JwtProperties shortLived = new JwtProperties(
                "test-secret-key-that-is-at-least-256-bits-long-for-hmac-sha256",
                0,
                0
        );
        JwtService shortLivedService = new JwtService(shortLived, refreshTokenRepository);

        String token = shortLivedService.generateAccessToken(testUser);

        assertFalse(shortLivedService.isTokenValid(token));
    }

    @Test
    void hashToken_shouldReturnConsistentHash() {
        String hash1 = jwtService.hashToken("test-token");
        String hash2 = jwtService.hashToken("test-token");

        assertEquals(hash1, hash2);
    }

    @Test
    void hashToken_givenDifferentTokens_shouldReturnDifferentHashes() {
        String hash1 = jwtService.hashToken("token-1");
        String hash2 = jwtService.hashToken("token-2");

        assertFalse(hash1.equals(hash2));
    }
}
