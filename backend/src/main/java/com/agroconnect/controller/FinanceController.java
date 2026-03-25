package com.agroconnect.controller;

import com.agroconnect.dto.response.ActiveJobResponse;
import com.agroconnect.dto.response.FinanceSummaryResponse;
import com.agroconnect.dto.response.TransactionResponse;
import com.agroconnect.exception.GlobalExceptionHandler.ErrorResponse;
import com.agroconnect.security.UserPrincipal;
import com.agroconnect.service.FinanceService;
import com.agroconnect.service.ServiceRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/v1/providers/me/finance")
@RequiredArgsConstructor
@Tag(name = "Finance", description = "Provider financial dashboard and transaction history")
@PreAuthorize("hasRole('PROVIDER_MANAGER')")
public class FinanceController {

    private final FinanceService financeService;
    private final ServiceRequestService requestService;

    @GetMapping("/summary")
    @Operation(summary = "Get financial summary",
            description = "Returns aggregated financial metrics for the authenticated provider.")
    @ApiResponse(responseCode = "200", description = "Financial summary")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<FinanceSummaryResponse> getSummary(
            @AuthenticationPrincipal UserPrincipal principal) {
        var result = financeService.getSummary(principal.getId());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/transactions")
    @Operation(summary = "Get transaction history",
            description = "Returns paginated transaction history for the authenticated provider.")
    @ApiResponse(responseCode = "200", description = "Page of transactions")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Page<TransactionResponse>> getTransactions(
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var result = financeService.getTransactionHistory(principal.getId(), pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/active-jobs")
    @Operation(summary = "Get provider's active jobs",
            description = "Returns up to 5 active jobs with next-action context for the provider dashboard.")
    @ApiResponse(responseCode = "200", description = "List of active jobs")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Provider profile not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<List<ActiveJobResponse>> getActiveJobs(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(requestService.getActiveJobsForProvider(principal.getId()));
    }
}
