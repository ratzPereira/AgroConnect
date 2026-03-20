package com.agroconnect.controller;

import com.agroconnect.dto.request.CreateServiceRequestDto;
import com.agroconnect.dto.request.UpdateServiceRequestDto;
import com.agroconnect.dto.response.PresignedUrlResponse;
import com.agroconnect.dto.response.ServiceRequestResponse;
import com.agroconnect.dto.response.ServiceRequestSummaryResponse;
import com.agroconnect.exception.GlobalExceptionHandler.ErrorResponse;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.security.UserPrincipal;
import com.agroconnect.service.ServiceRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
import java.util.Map;

@RestController
@RequestMapping("/v1/requests")
@RequiredArgsConstructor
@Tag(name = "Service Requests", description = "Manage service requests")
public class ServiceRequestController {

    private final ServiceRequestService requestService;

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Create a draft service request", description = "Creates a new service request in DRAFT status. Only clients can create requests.")
    @ApiResponse(responseCode = "201", description = "Request created successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input data",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Only clients can create requests",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ServiceRequestResponse> create(
            @Valid @RequestBody CreateServiceRequestDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = requestService.create(dto, principal.getId());
        var location = URI.create("/api/v1/requests/" + response.id());
        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Update a draft service request", description = "Updates a service request that is still in DRAFT status. Only the owner can update.")
    @ApiResponse(responseCode = "200", description = "Request updated successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input data",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not the owner of this request",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Request not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Request is not in DRAFT status",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ServiceRequestResponse> update(
            @Parameter(description = "Request ID") @PathVariable Long id,
            @Valid @RequestBody UpdateServiceRequestDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = requestService.update(id, dto, principal.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Publish a service request", description = "Transitions a DRAFT request to PUBLISHED, making it visible to providers. Sets expiration date.")
    @ApiResponse(responseCode = "200", description = "Request published successfully")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not the owner of this request",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Request not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Invalid state transition",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ServiceRequestResponse> publish(
            @Parameter(description = "Request ID") @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = requestService.publish(id, principal.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Cancel a service request", description = "Cancels a service request. Cannot cancel requests in terminal states.")
    @ApiResponse(responseCode = "200", description = "Request cancelled successfully")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not the owner of this request",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Request not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Cannot cancel request in current state",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ServiceRequestResponse> cancel(
            @Parameter(description = "Request ID") @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = requestService.cancel(id, principal.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get service request details", description = "Returns full details of a service request including photos.")
    @ApiResponse(responseCode = "200", description = "Request details")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Request not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ServiceRequestResponse> getById(
            @Parameter(description = "Request ID") @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = requestService.getById(id, principal.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "List my service requests", description = "Returns paginated list of the client's own service requests.")
    @ApiResponse(responseCode = "200", description = "Page of service requests")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Only clients can list their requests",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Page<ServiceRequestSummaryResponse>> listMine(
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Filter by status") @RequestParam(required = false) RequestStatus status,
            @AuthenticationPrincipal UserPrincipal principal) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var result = requestService.listMyRequests(principal.getId(), status, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR')")
    @Operation(summary = "List available requests for provider", description = "Returns paginated list of PUBLISHED/WITH_PROPOSALS requests within the provider's service radius.")
    @ApiResponse(responseCode = "200", description = "Page of available service requests")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Only providers can view available requests",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Page<ServiceRequestSummaryResponse>> listAvailable(
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        var pageable = PageRequest.of(page, size);
        var result = requestService.listAvailableForProvider(principal.getId(), pageable);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/photos/upload")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Get presigned upload URL for photo", description = "Returns a presigned URL for uploading a photo to the request.")
    @ApiResponse(responseCode = "200", description = "Presigned URL generated")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not the owner of this request",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Request not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<PresignedUrlResponse> getUploadUrl(
            @Parameter(description = "Request ID") @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = requestService.generateUploadUrl(id, principal.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/photos")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Confirm photo upload", description = "Confirms that a photo was uploaded and saves its URL to the request.")
    @ApiResponse(responseCode = "200", description = "Photo confirmed")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not the owner of this request",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Request not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ServiceRequestResponse> confirmPhoto(
            @Parameter(description = "Request ID") @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        String photoUrl = body.get("photoUrl");
        var response = requestService.confirmPhotoUpload(id, photoUrl, principal.getId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/photos/{photoId}")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Delete a photo from request", description = "Removes a photo from the service request.")
    @ApiResponse(responseCode = "204", description = "Photo deleted successfully")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not the owner of this request",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Request or photo not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Void> deletePhoto(
            @Parameter(description = "Request ID") @PathVariable Long id,
            @Parameter(description = "Photo ID") @PathVariable Long photoId,
            @AuthenticationPrincipal UserPrincipal principal) {
        requestService.deletePhoto(id, photoId, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
