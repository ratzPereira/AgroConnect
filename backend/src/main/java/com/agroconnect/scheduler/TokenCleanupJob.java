package com.agroconnect.scheduler;

import com.agroconnect.repository.EmailVerificationTokenRepository;
import com.agroconnect.repository.PasswordResetTokenRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
@RequiredArgsConstructor
public class TokenCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(TokenCleanupJob.class);
    private static final int RETENTION_DAYS = 7;

    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        Instant cutoff = Instant.now().minus(RETENTION_DAYS, ChronoUnit.DAYS);

        emailVerificationTokenRepository.deleteByExpiresAtBeforeOrUsedAtBefore(cutoff, cutoff);
        passwordResetTokenRepository.deleteByExpiresAtBeforeOrUsedAtBefore(cutoff, cutoff);

        log.info("Token cleanup completed (cutoff: {})", cutoff);
    }
}
