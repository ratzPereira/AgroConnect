package com.agroconnect.controller;

import com.agroconnect.service.TestDataResetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/admin/test")
@Profile("e2e")
@RequiredArgsConstructor
@Tag(name = "E2E Test Utilities", description = "[E2E ONLY] Profile-guarded endpoints for Playwright tests")
public class TestDataController {

    private final TestDataResetService resetService;

    @PostMapping("/reset-demo-data")
    @Operation(
        summary = "[E2E ONLY] Reset DB to seed state",
        description = "Wipes all tables and re-runs Flyway migrations + seeds. Available ONLY when SPRING_PROFILES_ACTIVE includes 'e2e'. Used by Playwright fixtures to guarantee a clean starting state."
    )
    @ApiResponse(responseCode = "204", description = "DB reset complete")
    public ResponseEntity<Void> reset() {
        resetService.resetToSeed();
        return ResponseEntity.noContent().build();
    }
}
