package com.agroconnect.controller;

import com.agroconnect.dto.request.ReassignExecutionDto;
import com.agroconnect.dto.request.ScheduleUpdateDto;
import com.agroconnect.dto.response.CalendarAlertsResponse;
import com.agroconnect.dto.response.CalendarEventResponse;
import com.agroconnect.dto.response.CalendarSummaryResponse;
import com.agroconnect.dto.response.ConflictResponse;
import com.agroconnect.dto.response.MaintenanceWindowResponse;
import com.agroconnect.dto.response.WorkloadHeatmapResponse;
import com.agroconnect.security.UserPrincipal;
import com.agroconnect.service.CalendarService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/v1/providers/me/calendar")
@RequiredArgsConstructor
@Tag(name = "Provider Calendar", description = "Provider scheduling and calendar management")
public class CalendarController {

    private final CalendarService calendarService;

    @GetMapping
    @Operation(summary = "Get calendar events", description = "Returns scheduled executions for the authenticated provider within a date range")
    @ApiResponse(responseCode = "200", description = "List of calendar events")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @ApiResponse(responseCode = "403", description = "Not a provider")
    public ResponseEntity<List<CalendarEventResponse>> getCalendarEvents(
            @Parameter(description = "Start date (YYYY-MM-DD)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "End date (YYYY-MM-DD)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @AuthenticationPrincipal UserPrincipal principal) {
        var events = calendarService.getCalendarEvents(principal.getId(), from, to);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/conflicts")
    @Operation(summary = "Detect scheduling conflicts", description = "Returns detected conflicts where a team member or machine is double-booked (with time-window awareness)")
    @ApiResponse(responseCode = "200", description = "List of conflicts (empty if none)")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @ApiResponse(responseCode = "403", description = "Not a provider")
    public ResponseEntity<List<ConflictResponse>> getConflicts(
            @Parameter(description = "Start date (YYYY-MM-DD)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "End date (YYYY-MM-DD)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @AuthenticationPrincipal UserPrincipal principal) {
        var conflicts = calendarService.getConflicts(principal.getId(), from, to);
        return ResponseEntity.ok(conflicts);
    }

    @GetMapping("/summary")
    @Operation(summary = "Calendar KPIs for visible range",
            description = "Returns aggregate counts, revenue, and utilization for the calendar header strip")
    @ApiResponse(responseCode = "200", description = "Summary KPIs for the date range")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @ApiResponse(responseCode = "403", description = "Not a provider")
    public ResponseEntity<CalendarSummaryResponse> getSummary(
            @Parameter(description = "Start date (YYYY-MM-DD)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "End date (YYYY-MM-DD)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @AuthenticationPrincipal UserPrincipal principal) {
        var summary = calendarService.getCalendarSummary(principal.getId(), from, to);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/workload")
    @Operation(summary = "Workload heatmap per operator",
            description = "Returns one row per active operator, with scheduled minutes for each day in the range — feeds the heatmap visualization")
    @ApiResponse(responseCode = "200", description = "Workload data")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @ApiResponse(responseCode = "403", description = "Not a provider")
    public ResponseEntity<WorkloadHeatmapResponse> getWorkload(
            @Parameter(description = "Start date (YYYY-MM-DD)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "End date (YYYY-MM-DD)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @AuthenticationPrincipal UserPrincipal principal) {
        var workload = calendarService.getWorkloadHeatmap(principal.getId(), from, to);
        return ResponseEntity.ok(workload);
    }

    @GetMapping("/maintenance-windows")
    @Operation(summary = "Upcoming maintenance windows",
            description = "Returns maintenance entries whose next-due-date falls inside the visible range, for overlay on the calendar")
    @ApiResponse(responseCode = "200", description = "List of maintenance windows (empty if none)")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @ApiResponse(responseCode = "403", description = "Not a provider")
    public ResponseEntity<List<MaintenanceWindowResponse>> getMaintenanceWindows(
            @Parameter(description = "Start date (YYYY-MM-DD)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "End date (YYYY-MM-DD)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @AuthenticationPrincipal UserPrincipal principal) {
        var windows = calendarService.getMaintenanceWindows(principal.getId(), from, to);
        return ResponseEntity.ok(windows);
    }

    @GetMapping("/alerts")
    @Operation(summary = "Operational alerts for visible range",
            description = "Returns side-rail alerts: conflicts, maintenance due, payments awaiting confirmation past SLA, pending proposals")
    @ApiResponse(responseCode = "200", description = "Alerts grouped by category")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @ApiResponse(responseCode = "403", description = "Not a provider")
    public ResponseEntity<CalendarAlertsResponse> getAlerts(
            @Parameter(description = "Start date (YYYY-MM-DD)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "End date (YYYY-MM-DD)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @AuthenticationPrincipal UserPrincipal principal) {
        var alerts = calendarService.getAlerts(principal.getId(), from, to);
        return ResponseEntity.ok(alerts);
    }

    @PatchMapping("/executions/{id}/schedule")
    @Operation(summary = "Update execution schedule",
            description = "Set or update the scheduled dates and optional time window for an execution")
    @ApiResponse(responseCode = "200", description = "Updated calendar event")
    @ApiResponse(responseCode = "400", description = "Invalid dates or times")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @ApiResponse(responseCode = "403", description = "Not the owner of this execution")
    @ApiResponse(responseCode = "404", description = "Execution not found")
    public ResponseEntity<CalendarEventResponse> updateSchedule(
            @Parameter(description = "Execution ID") @PathVariable Long id,
            @Valid @RequestBody ScheduleUpdateDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var event = calendarService.updateSchedule(id, dto, principal.getId());
        return ResponseEntity.ok(event);
    }

    @PostMapping("/executions/{id}/reassign")
    @Operation(summary = "Reassign an execution to a different operator",
            description = "Swap the operator (and optionally the machine) on an existing execution assignment row")
    @ApiResponse(responseCode = "200", description = "Updated calendar event")
    @ApiResponse(responseCode = "400", description = "Invalid reassignment (already assigned, etc.)")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @ApiResponse(responseCode = "403", description = "Not the owner of this execution")
    @ApiResponse(responseCode = "404", description = "Execution, operator or machine not found")
    public ResponseEntity<CalendarEventResponse> reassign(
            @Parameter(description = "Execution ID") @PathVariable Long id,
            @Valid @RequestBody ReassignExecutionDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var event = calendarService.reassignExecution(id, dto, principal.getId());
        return ResponseEntity.ok(event);
    }
}
