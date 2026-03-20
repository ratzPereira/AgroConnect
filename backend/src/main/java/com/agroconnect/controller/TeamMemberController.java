package com.agroconnect.controller;

import com.agroconnect.dto.request.CreateTeamMemberDto;
import com.agroconnect.dto.request.UpdateTeamMemberDto;
import com.agroconnect.dto.response.TeamMemberResponse;
import com.agroconnect.exception.GlobalExceptionHandler.ErrorResponse;
import com.agroconnect.security.UserPrincipal;
import com.agroconnect.service.TeamMemberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/v1/providers/me/team")
@RequiredArgsConstructor
@Tag(name = "Team Members", description = "Manage provider team members")
@PreAuthorize("hasRole('PROVIDER_MANAGER')")
public class TeamMemberController {

    private final TeamMemberService teamMemberService;

    @GetMapping
    @Operation(summary = "List active team members",
            description = "Returns all active team members for the authenticated provider.")
    @ApiResponse(responseCode = "200", description = "List of team members")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<List<TeamMemberResponse>> list(
            @AuthenticationPrincipal UserPrincipal principal) {
        var result = teamMemberService.listByProvider(principal.getId());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get team member details")
    @ApiResponse(responseCode = "200", description = "Team member details")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Team member not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<TeamMemberResponse> getById(
            @Parameter(description = "Team member ID") @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        var result = teamMemberService.getById(id, principal.getId());
        return ResponseEntity.ok(result);
    }

    @PostMapping
    @Operation(summary = "Create a new team member")
    @ApiResponse(responseCode = "201", description = "Team member created")
    @ApiResponse(responseCode = "400", description = "Invalid input",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Duplicate email",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<TeamMemberResponse> create(
            @Valid @RequestBody CreateTeamMemberDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = teamMemberService.create(dto, principal.getId());
        var location = URI.create("/v1/providers/me/team/" + response.id());
        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a team member")
    @ApiResponse(responseCode = "200", description = "Team member updated")
    @ApiResponse(responseCode = "400", description = "Invalid input",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Team member not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<TeamMemberResponse> update(
            @Parameter(description = "Team member ID") @PathVariable Long id,
            @Valid @RequestBody UpdateTeamMemberDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = teamMemberService.update(id, dto, principal.getId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deactivate a team member",
            description = "Soft-deletes the team member by setting active=false.")
    @ApiResponse(responseCode = "204", description = "Team member deactivated")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Team member not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Void> deactivate(
            @Parameter(description = "Team member ID") @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        teamMemberService.deactivate(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
