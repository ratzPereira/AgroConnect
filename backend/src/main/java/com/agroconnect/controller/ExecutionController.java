package com.agroconnect.controller;

import com.agroconnect.dto.request.AssignExecutionDto;
import com.agroconnect.dto.request.CheckinExecutionDto;
import com.agroconnect.dto.request.CompleteExecutionDto;
import com.agroconnect.dto.response.ExecutionPhotoResponse;
import com.agroconnect.dto.response.PresignedUrlResponse;
import com.agroconnect.dto.response.ServiceExecutionResponse;
import com.agroconnect.exception.GlobalExceptionHandler.ErrorResponse;
import com.agroconnect.security.UserPrincipal;
import com.agroconnect.service.ExecutionService;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/v1/executions")
@RequiredArgsConstructor
@Tag(name = "Executions", description = "Manage service execution workflow")
public class ExecutionController {

    private final ExecutionService executionService;

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
        var response = executionService.getByRequestId(requestId, principal.getId());
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
        Double latitude = body.get("latitude") != null ? ((Number) body.get("latitude")).doubleValue() : null;
        Double longitude = body.get("longitude") != null ? ((Number) body.get("longitude")).doubleValue() : null;
        Instant takenAt = body.get("takenAt") != null ? Instant.parse((String) body.get("takenAt")) : null;

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
}
