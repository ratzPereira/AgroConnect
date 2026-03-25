package com.agroconnect.controller;

import com.agroconnect.dto.response.ClientDashboardResponse;
import com.agroconnect.exception.GlobalExceptionHandler.ErrorResponse;
import com.agroconnect.security.UserPrincipal;
import com.agroconnect.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Dashboard aggregate endpoints")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/client")
    @Operation(summary = "Get client dashboard",
            description = "Returns aggregated dashboard data for the authenticated client including stats, recent requests, and notifications.")
    @ApiResponse(responseCode = "200", description = "Dashboard data")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ClientDashboardResponse> getClientDashboard(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(dashboardService.getClientDashboard(principal.getId()));
    }
}
