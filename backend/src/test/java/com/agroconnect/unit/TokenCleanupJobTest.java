package com.agroconnect.unit;

import com.agroconnect.repository.EmailVerificationTokenRepository;
import com.agroconnect.repository.PasswordResetTokenRepository;
import com.agroconnect.scheduler.TokenCleanupJob;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class TokenCleanupJobTest {

    @Mock
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    private TokenCleanupJob tokenCleanupJob;

    @BeforeEach
    void setUp() {
        tokenCleanupJob = new TokenCleanupJob(emailVerificationTokenRepository, passwordResetTokenRepository);
    }

    @Test
    void cleanupExpiredTokens_shouldDeleteFromBothRepositories() {
        tokenCleanupJob.cleanupExpiredTokens();

        verify(emailVerificationTokenRepository)
                .deleteByExpiresAtBeforeOrUsedAtBefore(
                        any(Instant.class),
                        any(Instant.class));
        verify(passwordResetTokenRepository)
                .deleteByExpiresAtBeforeOrUsedAtBefore(
                        any(Instant.class),
                        any(Instant.class));
    }

    @Test
    void cleanupExpiredTokens_shouldUse7DayCutoff() {
        Instant expectedCutoff = Instant.now().minus(7, ChronoUnit.DAYS);

        tokenCleanupJob.cleanupExpiredTokens();

        ArgumentCaptor<Instant> emailCutoffCaptor1 = ArgumentCaptor.forClass(Instant.class);
        ArgumentCaptor<Instant> emailCutoffCaptor2 = ArgumentCaptor.forClass(Instant.class);
        verify(emailVerificationTokenRepository)
                .deleteByExpiresAtBeforeOrUsedAtBefore(emailCutoffCaptor1.capture(), emailCutoffCaptor2.capture());

        Instant capturedCutoff = emailCutoffCaptor1.getValue();
        assertTrue(Duration.between(expectedCutoff, capturedCutoff).abs().toSeconds() < 5,
                "Cutoff should be approximately 7 days before now");
    }

    @Test
    void cleanupExpiredTokens_shouldPassSameInstantToBothRepos() {
        tokenCleanupJob.cleanupExpiredTokens();

        ArgumentCaptor<Instant> emailCaptor1 = ArgumentCaptor.forClass(Instant.class);
        ArgumentCaptor<Instant> emailCaptor2 = ArgumentCaptor.forClass(Instant.class);
        verify(emailVerificationTokenRepository)
                .deleteByExpiresAtBeforeOrUsedAtBefore(emailCaptor1.capture(), emailCaptor2.capture());

        ArgumentCaptor<Instant> passwordCaptor1 = ArgumentCaptor.forClass(Instant.class);
        ArgumentCaptor<Instant> passwordCaptor2 = ArgumentCaptor.forClass(Instant.class);
        verify(passwordResetTokenRepository)
                .deleteByExpiresAtBeforeOrUsedAtBefore(passwordCaptor1.capture(), passwordCaptor2.capture());

        // Both repositories should receive the same cutoff Instant
        assertEquals(emailCaptor1.getValue(), passwordCaptor1.getValue(),
                "Both repositories should receive the same expiry cutoff");
        assertEquals(emailCaptor2.getValue(), passwordCaptor2.getValue(),
                "Both repositories should receive the same used cutoff");

        // The two arguments to each call should also be the same Instant
        assertEquals(emailCaptor1.getValue(), emailCaptor2.getValue(),
                "expiryCutoff and usedCutoff should be the same Instant");
    }
}
