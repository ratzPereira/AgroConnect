package com.agroconnect.controller;

import com.agroconnect.dto.request.CreateMachineDto;
import com.agroconnect.dto.request.CreateMachineExpenseDto;
import com.agroconnect.dto.request.CreateMaintenanceLogDto;
import com.agroconnect.dto.request.UpdateMachineDto;
import com.agroconnect.dto.response.MachineAnalyticsResponse;
import com.agroconnect.dto.response.MachineExpenseResponse;
import com.agroconnect.dto.response.MachineJobResponse;
import com.agroconnect.dto.response.MachineMaintenanceLogResponse;
import com.agroconnect.dto.response.MachineResponse;
import com.agroconnect.exception.GlobalExceptionHandler.ErrorResponse;
import com.agroconnect.model.enums.MachineStatus;
import com.agroconnect.security.UserPrincipal;
import com.agroconnect.service.MachineAnalyticsService;
import com.agroconnect.service.MachineExpenseService;
import com.agroconnect.service.MachineMaintenanceService;
import com.agroconnect.service.MachineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/v1/providers/me/machines")
@RequiredArgsConstructor
@Tag(name = "Machines", description = "Manage provider machines and equipment")
public class MachineController {

    private final MachineService machineService;
    private final MachineAnalyticsService machineAnalyticsService;
    private final MachineMaintenanceService machineMaintenanceService;
    private final MachineExpenseService machineExpenseService;

    @GetMapping
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR')")
    @Operation(summary = "List machines",
            description = "Returns all machines for the authenticated provider. Optionally filter by status.")
    @ApiResponse(responseCode = "200", description = "List of machines")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<List<MachineResponse>> list(
            @Parameter(description = "Filter by status") @RequestParam(required = false) MachineStatus status,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<MachineResponse> result;
        if (status != null) {
            result = machineService.listByProviderAndStatus(principal.getId(), status);
        } else {
            result = machineService.listByProvider(principal.getId());
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR')")
    @Operation(summary = "Get machine details")
    @ApiResponse(responseCode = "200", description = "Machine details")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Machine not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<MachineResponse> getById(
            @Parameter(description = "Machine ID") @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        var result = machineService.getById(id, principal.getId());
        return ResponseEntity.ok(result);
    }

    @PostMapping
    @PreAuthorize("hasRole('PROVIDER_MANAGER')")
    @Operation(summary = "Create a new machine")
    @ApiResponse(responseCode = "201", description = "Machine created")
    @ApiResponse(responseCode = "400", description = "Invalid input",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<MachineResponse> create(
            @Valid @RequestBody CreateMachineDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = machineService.create(dto, principal.getId());
        var location = URI.create("/v1/providers/me/machines/" + response.id());
        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PROVIDER_MANAGER')")
    @Operation(summary = "Update a machine")
    @ApiResponse(responseCode = "200", description = "Machine updated")
    @ApiResponse(responseCode = "400", description = "Invalid input",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Machine not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<MachineResponse> update(
            @Parameter(description = "Machine ID") @PathVariable Long id,
            @Valid @RequestBody UpdateMachineDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = machineService.update(id, dto, principal.getId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PROVIDER_MANAGER')")
    @Operation(summary = "Delete a machine",
            description = "Only machines with RETIRED status can be deleted.")
    @ApiResponse(responseCode = "204", description = "Machine deleted")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Machine not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Machine is not retired",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Void> delete(
            @Parameter(description = "Machine ID") @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        machineService.delete(id, principal.getId());
        return ResponseEntity.noContent().build();
    }

    // ─────────────────────── Analytics ───────────────────────

    @GetMapping("/{id}/details")
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR')")
    @Operation(summary = "Get aggregated analytics for a machine",
            description = "Aggregates jobs done, machine hours, revenue, maintenance and operating expenses over the period. " +
                    "Defaults to the current year if no range is provided.")
    @ApiResponse(responseCode = "200", description = "Analytics summary")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Machine not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<MachineAnalyticsResponse> getAnalytics(
            @Parameter(description = "Machine ID") @PathVariable Long id,
            @Parameter(description = "Inclusive period start (defaults to first day of the current year)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "Inclusive period end (defaults to today)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(machineAnalyticsService.getAnalytics(id, principal.getId(), from, to));
    }

    @GetMapping("/{id}/jobs")
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR')")
    @Operation(summary = "List jobs for a machine",
            description = "Paginated list of completed jobs in which this machine was used during the given period.")
    @ApiResponse(responseCode = "200", description = "Page of jobs")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Machine not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Page<MachineJobResponse>> listJobs(
            @Parameter(description = "Machine ID") @PathVariable Long id,
            @Parameter(description = "Inclusive period start") @RequestParam(required = false)
                @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "Inclusive period end") @RequestParam(required = false)
                @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @ParameterObject @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(machineAnalyticsService.listJobs(id, principal.getId(), from, to, pageable));
    }

    // ─────────────────────── Maintenance ledger ───────────────────────

    @GetMapping("/{id}/maintenance")
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR')")
    @Operation(summary = "List maintenance log entries for a machine")
    @ApiResponse(responseCode = "200", description = "List of maintenance entries (most recent first)")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Machine not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<List<MachineMaintenanceLogResponse>> listMaintenance(
            @Parameter(description = "Machine ID") @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(machineMaintenanceService.list(id, principal.getId()));
    }

    @PostMapping("/{id}/maintenance")
    @PreAuthorize("hasRole('PROVIDER_MANAGER')")
    @Operation(summary = "Record a maintenance log entry",
            description = "Creates an immutable maintenance entry and updates the machine's last/next maintenance dates.")
    @ApiResponse(responseCode = "201", description = "Maintenance entry created")
    @ApiResponse(responseCode = "400", description = "Invalid input",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Machine not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<MachineMaintenanceLogResponse> createMaintenance(
            @Parameter(description = "Machine ID") @PathVariable Long id,
            @Valid @RequestBody CreateMaintenanceLogDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = machineMaintenanceService.create(id, dto, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}/maintenance/{logId}")
    @PreAuthorize("hasRole('PROVIDER_MANAGER')")
    @Operation(summary = "Delete a maintenance log entry")
    @ApiResponse(responseCode = "204", description = "Entry deleted")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Machine or log not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Void> deleteMaintenance(
            @Parameter(description = "Machine ID") @PathVariable Long id,
            @Parameter(description = "Maintenance log ID") @PathVariable Long logId,
            @AuthenticationPrincipal UserPrincipal principal) {
        machineMaintenanceService.delete(id, logId, principal.getId());
        return ResponseEntity.noContent().build();
    }

    // ─────────────────────── Expense ledger ───────────────────────

    @GetMapping("/{id}/expenses")
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR')")
    @Operation(summary = "List operating expenses for a machine")
    @ApiResponse(responseCode = "200", description = "List of expenses (most recent first)")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Machine not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<List<MachineExpenseResponse>> listExpenses(
            @Parameter(description = "Machine ID") @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(machineExpenseService.list(id, principal.getId()));
    }

    @PostMapping("/{id}/expenses")
    @PreAuthorize("hasRole('PROVIDER_MANAGER')")
    @Operation(summary = "Record an operating expense")
    @ApiResponse(responseCode = "201", description = "Expense created")
    @ApiResponse(responseCode = "400", description = "Invalid input",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Machine not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<MachineExpenseResponse> createExpense(
            @Parameter(description = "Machine ID") @PathVariable Long id,
            @Valid @RequestBody CreateMachineExpenseDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = machineExpenseService.create(id, dto, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}/expenses/{expenseId}")
    @PreAuthorize("hasRole('PROVIDER_MANAGER')")
    @Operation(summary = "Delete an operating expense")
    @ApiResponse(responseCode = "204", description = "Expense deleted")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Machine or expense not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Void> deleteExpense(
            @Parameter(description = "Machine ID") @PathVariable Long id,
            @Parameter(description = "Expense ID") @PathVariable Long expenseId,
            @AuthenticationPrincipal UserPrincipal principal) {
        machineExpenseService.delete(id, expenseId, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
