package com.agroconnect.controller;

import com.agroconnect.dto.request.CreateProposalDto;
import com.agroconnect.dto.response.ProposalResponse;
import com.agroconnect.exception.GlobalExceptionHandler.ErrorResponse;
import com.agroconnect.security.UserPrincipal;
import com.agroconnect.service.ProposalService;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
@Tag(name = "Proposals", description = "Manage proposals for service requests")
public class ProposalController {

    private final ProposalService proposalService;

    @PostMapping("/requests/{requestId}/proposals")
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR')")
    @Operation(summary = "Create a proposal", description = "Submits a new proposal for a service request. Only providers can create proposals.")
    @ApiResponse(responseCode = "201", description = "Proposal created successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input data",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Only providers can create proposals",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Request not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Request not accepting proposals or duplicate proposal",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ProposalResponse> create(
            @Parameter(description = "Service request ID") @PathVariable Long requestId,
            @Valid @RequestBody CreateProposalDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = proposalService.create(requestId, dto, principal.getId());
        var location = URI.create("/api/v1/proposals/" + response.id());
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping("/requests/{requestId}/proposals")
    @Operation(summary = "List proposals for a request", description = "Returns all proposals for a specific service request.")
    @ApiResponse(responseCode = "200", description = "List of proposals")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Request not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<List<ProposalResponse>> listByRequest(
            @Parameter(description = "Service request ID") @PathVariable Long requestId,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = proposalService.listByRequest(requestId, principal.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/proposals/mine")
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR')")
    @Operation(summary = "List my proposals", description = "Returns paginated list of the provider's own proposals.")
    @ApiResponse(responseCode = "200", description = "Page of proposals")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Only providers can list their proposals",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Page<ProposalResponse>> listMine(
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var result = proposalService.listMyProposals(principal.getId(), pageable);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/proposals/{id}/accept")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Accept a proposal", description = "Accepts a proposal, rejects all others, transitions request to AWARDED, and creates escrow transaction.")
    @ApiResponse(responseCode = "200", description = "Proposal accepted successfully")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not the owner of the associated request",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Proposal not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Proposal or request in invalid state",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ProposalResponse> accept(
            @Parameter(description = "Proposal ID") @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = proposalService.accept(id, principal.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/proposals/{id}/withdraw")
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR')")
    @Operation(summary = "Withdraw a proposal", description = "Withdraws a pending proposal. Only the proposal owner can withdraw.")
    @ApiResponse(responseCode = "200", description = "Proposal withdrawn successfully")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not the owner of this proposal",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Proposal not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Proposal is not in PENDING status",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ProposalResponse> withdraw(
            @Parameter(description = "Proposal ID") @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = proposalService.withdraw(id, principal.getId());
        return ResponseEntity.ok(response);
    }
}
