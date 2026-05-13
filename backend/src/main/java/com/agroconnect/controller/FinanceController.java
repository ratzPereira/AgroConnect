package com.agroconnect.controller;

import com.agroconnect.dto.response.ActiveJobResponse;
import com.agroconnect.dto.response.FinanceSummaryResponse;
import com.agroconnect.dto.response.MonthlyBreakdownResponse;
import com.agroconnect.dto.response.TransactionResponse;
import com.agroconnect.dto.response.YearlyComparisonResponse;
import com.agroconnect.exception.GlobalExceptionHandler.ErrorResponse;
import com.agroconnect.exception.ValidationException;
import com.agroconnect.security.UserPrincipal;
import com.agroconnect.service.FinanceService;
import com.agroconnect.service.ServiceRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

@RestController
@RequestMapping("/v1/providers/me/finance")
@RequiredArgsConstructor
@Validated
@Tag(name = "Finance", description = "Provider financial dashboard and transaction history")
@PreAuthorize("hasRole('PROVIDER_MANAGER')")
public class FinanceController {

    private static final int MIN_YEAR = 2000;
    private static final int MAX_YEAR = 2100;
    private static final String INVALID_YEAR_MSG = "O ano deve estar entre 2000 e 2100.";
    private static final String INVALID_DATE_MSG = "Formato de data inválido. Use yyyy-MM-dd.";

    private final FinanceService financeService;
    private final ServiceRequestService requestService;

    @GetMapping("/summary")
    @Operation(summary = "Get financial summary",
            description = "Returns lifetime totals plus annual aggregates (revenue, materials, labor, machine expenses, real profit). "
                    + "When no year is supplied, defaults to the current calendar year (UTC).")
    @ApiResponse(responseCode = "200", description = "Financial summary")
    @ApiResponse(responseCode = "400", description = "Invalid year (must be between 2000 and 2100)",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<FinanceSummaryResponse> getSummary(
            @Parameter(description = "Year between 2000 and 2100 (defaults to current year)")
            @RequestParam(required = false)
            @Min(value = MIN_YEAR, message = INVALID_YEAR_MSG)
            @Max(value = MAX_YEAR, message = INVALID_YEAR_MSG)
            Integer year,
            @AuthenticationPrincipal UserPrincipal principal) {
        var result = financeService.getSummary(principal.getId(), year);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/monthly-breakdown")
    @Operation(summary = "Get monthly finance breakdown",
            description = "Returns 12 entries (January → December) with revenue, payouts, materials, labor, machine expenses and net profit "
                    + "for the requested year. Defaults to the current year.")
    @ApiResponse(responseCode = "200", description = "Monthly breakdown")
    @ApiResponse(responseCode = "400", description = "Invalid year (must be between 2000 and 2100)",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<MonthlyBreakdownResponse> getMonthlyBreakdown(
            @Parameter(description = "Year between 2000 and 2100 (defaults to current year)")
            @RequestParam(required = false)
            @Min(value = MIN_YEAR, message = INVALID_YEAR_MSG)
            @Max(value = MAX_YEAR, message = INVALID_YEAR_MSG)
            Integer year,
            @AuthenticationPrincipal UserPrincipal principal) {
        var result = financeService.getMonthlyBreakdown(principal.getId(), year);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/yearly-comparison")
    @Operation(summary = "Get current vs previous year comparison",
            description = "Compares revenue, net profit and completed-job count between the current and previous year, "
                    + "including percentage deltas (null when the previous year baseline is zero).")
    @ApiResponse(responseCode = "200", description = "Year-over-year comparison")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<YearlyComparisonResponse> getYearlyComparison(
            @AuthenticationPrincipal UserPrincipal principal) {
        var result = financeService.getYearlyComparison(principal.getId());
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

    @GetMapping("/export")
    @Operation(summary = "Export transactions as CSV",
            description = "Returns a CSV file with transaction history for the specified date range.")
    @ApiResponse(responseCode = "200", description = "CSV file download")
    @ApiResponse(responseCode = "400", description = "Invalid date format (expected yyyy-MM-dd)",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<byte[]> exportCsv(
            @Parameter(description = "Start date (yyyy-MM-dd)") @RequestParam String from,
            @Parameter(description = "End date (yyyy-MM-dd)") @RequestParam String to,
            @AuthenticationPrincipal UserPrincipal principal) {
        LocalDate fromDate;
        LocalDate toDate;
        try {
            fromDate = LocalDate.parse(from);
            toDate = LocalDate.parse(to);
        } catch (DateTimeParseException e) {
            throw new ValidationException(INVALID_DATE_MSG);
        }
        byte[] csv = financeService.exportTransactionsCsv(principal.getId(), fromDate, toDate);

        String filename = "transacoes_" + fromDate.format(DateTimeFormatter.ISO_LOCAL_DATE)
                + "_" + toDate.format(DateTimeFormatter.ISO_LOCAL_DATE) + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
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
