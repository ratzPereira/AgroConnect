package com.agroconnect.repository;

import com.agroconnect.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.time.Instant;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    @Modifying
    void deleteByUserIdAndUsedAtIsNull(Long userId);

    @Modifying
    void deleteByExpiresAtBeforeOrUsedAtBefore(Instant expiryCutoff, Instant usedCutoff);
}
