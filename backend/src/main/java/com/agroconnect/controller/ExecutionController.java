package com.agroconnect.controller;

import com.agroconnect.dto.request.AssignExecutionDto;
import com.agroconnect.dto.request.CheckinExecutionDto;
import com.agroconnect.dto.request.CompleteExecutionDto;
import com.agroconnect.dto.request.RecordResourceUsageDto;
import com.agroconnect.dto.request.UpdateAssignmentHoursDto;
import com.agroconnect.dto.response.AssignmentCostResponse;
import com.agroconnect.dto.response.ExecutionPhotoResponse;
import com.agroconnect.dto.response.ExecutionResourceUsageResponse;
import com.agroconnect.dto.response.JobCostsResponse;
import com.agroconnect.dto.response.PresignedUrlResponse;
import com.agroconnect.dto.response.ServiceExecutionResponse;
import com.agroconnect.exception.GlobalExceptionHandler.ErrorResponse;
import com.agroconnect.security.UserPrincipal;
import com.agroconnect.service.ExecutionService;
import com.agroconnect.service.JobCostingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Map;

@RestController
@RequestMapping("/v1/executions")
@RequiredArgsConstructor
@Tag(name = "Executions", description = "Manage service execution workflow")
public class ExecutionController {

    private final ExecutionService executionService;
    private final JobCostingService jobCostingService;

    @GetMapping("/request/{requestId}")
    @Operation(summary = "Get execution for a request",
            description = "Returns the execution details for a given service request.")
    @ApiResponse(responseCode = "200", description = "Execution details")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Execution not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ServiceExecutionResponse> getByRequest(
            @Parameter(description = "Service request ID") @PathVariable Long requestId,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = executionService.getByRequestId(requestId, principal.getId(), principal.isAdmin());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasRole('PROVIDER_MANAGER')")
    @Operation(summary = "Assign team member to execution",
            description = "Assigns a team member and optionally a machine to this execution.")
    @ApiResponse(responseCode = "200", description = "Assignment created")
    @ApiResponse(responseCode = "400", description = "Invalid input",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not the provider for this execution",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Execution, team member, or machine not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Team member already assigned",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ServiceExecutionResponse> assign(
            @Parameter(description = "Execution ID") @PathVariable Long id,
            @Valid @RequestBody AssignExecutionDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = executionService.assign(id, dto, principal.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/checkin")
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR')")
    @Operation(summary = "GPS check-in at service location",
            description = "Records GPS check-in. Must be within 500m of the service location. Transitions request to IN_PROGRESS.")
    @ApiResponse(responseCode = "200", description = "Check-in successful")
    @ApiResponse(responseCode = "400", description = "Too far from service location",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not the provider for this execution",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Already checked in or invalid state",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ServiceExecutionResponse> checkin(
            @Parameter(description = "Execution ID") @PathVariable Long id,
            @Valid @RequestBody CheckinExecutionDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = executionService.checkin(id, dto, principal.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/photos/upload")
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR')")
    @Operation(summary = "Get presigned upload URL for execution photo",
            description = "Returns a presigned URL for uploading a photo documenting the execution.")
    @ApiResponse(responseCode = "200", description = "Presigned URL generated")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not the provider for this execution",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Execution not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<PresignedUrlResponse> getPhotoUploadUrl(
            @Parameter(description = "Execution ID") @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = executionService.generatePhotoUploadUrl(id, principal.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/photos")
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR')")
    @Operation(summary = "Confirm execution photo upload",
            description = "Confirms that a photo was uploaded and saves its metadata.")
    @ApiResponse(responseCode = "200", description = "Photo confirmed")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not the provider for this execution",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Execution not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ServiceExecutionResponse> confirmPhoto(
            @Parameter(description = "Execution ID") @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        String photoUrl = (String) body.get("photoUrl");
        if (photoUrl == null || photoUrl.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Double latitude = body.get("latitude") != null ? ((Number) body.get("latitude")).doubleValue() : null;
        Double longitude = body.get("longitude") != null ? ((Number) body.get("longitude")).doubleValue() : null;
        String takenAtStr = body.get("takenAt") != null ? body.get("takenAt").toString() : null;
        Instant takenAt = null;
        if (takenAtStr != null && !takenAtStr.isBlank()) {
            try {
                takenAt = Instant.parse(takenAtStr);
            } catch (DateTimeParseException e) {
                return ResponseEntity.badRequest().build();
            }
        }

        var response = executionService.confirmPhoto(id, photoUrl, latitude, longitude, takenAt, principal.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD')")
    @Operation(summary = "Mark execution as complete",
            description = "Marks the execution as completed. Transitions request to AWAITING_CONFIRMATION and notifies client.")
    @ApiResponse(responseCode = "200", description = "Execution completed")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not the provider for this execution",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Invalid state (not IN_PROGRESS or no check-in)",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ServiceExecutionResponse> complete(
            @Parameter(description = "Execution ID") @PathVariable Long id,
            @Valid @RequestBody CompleteExecutionDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = executionService.complete(id, dto, principal.getId());
        return ResponseEntity.ok(response);
    }

    // ─────────────────── Job Costing ───────────────────

    @GetMapping("/{id}/costs")
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR')")
    @Operation(summary = "Get job costing summary",
            description = "Returns revenue, materials, labor, commission, profit and margin for the execution, "
                    + "plus per-assignment labor breakdown and recorded resource usages.")
    @ApiResponse(responseCode = "200", description = "Costing summary")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not the provider for this execution",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Execution not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<JobCostsResponse> getCosts(
            @Parameter(description = "Execution ID") @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(jobCostingService.getCosts(id, principal.getId()));
    }

    @PostMapping("/{id}/resource-usage")
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR')")
    @Operation(summary = "Record inventory consumed by this execution",
            description = "Decrements inventory (CONSUMPTION movement) and links the resulting usage row to "
                    + "this execution. Snapshots the current WAC for cost stability. Only allowed after "
                    + "check-in and before completion.")
    @ApiResponse(responseCode = "201", description = "Resource usage recorded")
    @ApiResponse(responseCode = "400", description = "Invalid input",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not the provider for this execution",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Execution or inventory item not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Execution completed, insufficient stock, or pre-checkin",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ExecutionResourceUsageResponse> recordResourceUsage(
            @Parameter(description = "Execution ID") @PathVariable Long id,
            @Valid @RequestBody RecordResourceUsageDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = jobCostingService.recordResourceUsage(id, dto, principal.getId());
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}/resource-usage/{usageId}")
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD')")
    @Operation(summary = "Reverse a recorded resource usage",
            description = "Deletes the usage row and creates a compensating ADJUSTMENT_IN movement so stock "
                    + "is restored at the original unit cost (preserving WAC). Only allowed before completion.")
    @ApiResponse(responseCode = "204", description = "Resource usage reversed")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not the provider for this execution",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Usage not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Execution already completed",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Void> deleteResourceUsage(
            @Parameter(description = "Execution ID") @PathVariable Long id,
            @Parameter(description = "Resource usage ID") @PathVariable Long usageId,
            @AuthenticationPrincipal UserPrincipal principal) {
        jobCostingService.deleteResourceUsage(id, usageId, principal.getId());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/assignments/{assignmentId}/hours")
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR')")
    @Operation(summary = "Update labor / machine hours on an assignment",
            description = "Sets hours_worked and machine_hours on the assignment. Only allowed before "
                    + "completion. After completion, the hourly_rate_snapshot is locked and any further "
                    + "edit attempt returns 409.")
    @ApiResponse(responseCode = "200", description = "Assignment hours updated")
    @ApiResponse(responseCode = "400", description = "Invalid input",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not the provider for this execution",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Assignment not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Execution already completed",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<AssignmentCostResponse> updateAssignmentHours(
            @Parameter(description = "Execution ID") @PathVariable Long id,
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Valid @RequestBody UpdateAssignmentHoursDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = jobCostingService.updateAssignmentHours(id, assignmentId, dto, principal.getId());
        return ResponseEntity.ok(response);
    }
}
