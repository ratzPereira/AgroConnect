package com.agroconnect.integration;

import com.agroconnect.fixture.TestContainersConfig;
import com.agroconnect.service.TestDataResetService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies the /v1/admin/test/reset-demo-data endpoint is wired and publicly
 * accessible when the "e2e" Spring profile is active.
 *
 * The TestDataResetService is spied with a no-op replacement for resetToSeed()
 * to avoid running the real Flyway clean + migrate against the shared
 * TestContainers Postgres. The real operation would invalidate JDBC
 * prepared-statement caches in other ITs and cascade failures (PSQLException
 * SQLSTATE 0A000 "cached plan must not change result type"). The real reset
 * is exercised end-to-end by Playwright against a live dev backend, where no
 * other tests share the connection pool.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("e2e")
class TestDataControllerE2EIT extends TestContainersConfig {

    @Autowired
    private MockMvc mvc;

    @SpyBean
    private TestDataResetService resetService;

    @Test
    void postResetDemoData_shouldReturn204_andInvokeResetService() throws Exception {
        Mockito.doNothing().when(resetService).resetToSeed();

        mvc.perform(post("/v1/admin/test/reset-demo-data"))
                .andExpect(status().isNoContent());

        Mockito.verify(resetService).resetToSeed();
    }
}
