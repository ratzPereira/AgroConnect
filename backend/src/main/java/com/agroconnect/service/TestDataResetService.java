package com.agroconnect.service;

import lombok.RequiredArgsConstructor;
import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("e2e")
@RequiredArgsConstructor
public class TestDataResetService {

    private static final Logger log = LoggerFactory.getLogger(TestDataResetService.class);
    private final Flyway flyway;

    public void resetToSeed() {
        log.warn("[E2E] Resetting database to seed state — Flyway clean + migrate");
        flyway.clean();
        flyway.migrate();
    }
}
