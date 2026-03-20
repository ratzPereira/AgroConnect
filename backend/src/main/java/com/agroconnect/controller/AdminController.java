package com.agroconnect.controller;

import com.agroconnect.dto.response.AdminDashboardResponse;
import com.agroconnect.dto.response.AdminDisputeResponse;
import com.agroconnect.dto.response.AdminUserResponse;
import com.agroconnect.exception.GlobalExceptionHandler.ErrorResponse;
import com.agroconnect.model.enums.Role;
import com.agroconnect.service.AdminService;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Platform administration endpoints")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get platform dashboard metrics",
            description = "Returns aggregated platform metrics including users, requests, transactions, and ratings.")
    @ApiResponse(responseCode = "200", description = "Dashboard metrics")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not an admin",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<AdminDashboardResponse> getDashboard() {
        var result = adminService.getDashboard();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/users")
    @Operation(summary = "List users",
            description = "Returns paginated list of users, optionally filtered by role.")
    @ApiResponse(responseCode = "200", description = "Page of users")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not an admin",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Page<AdminUserResponse>> listUsers(
            @Parameter(description = "Filter by role") @RequestParam(required = false) Role role,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var result = adminService.listUsers(role, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "Get user details")
    @ApiResponse(responseCode = "200", description = "User details")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not an admin",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "User not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<AdminUserResponse> getUserDetail(
            @Parameter(description = "User ID") @PathVariable Long id) {
        var result = adminService.getUserDetail(id);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/users/{id}/ban")
    @Operation(summary = "Ban a user",
            description = "Sets the user's active flag to false, preventing login.")
    @ApiResponse(responseCode = "204", description = "User banned")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not an admin",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "User not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Void> banUser(
            @Parameter(description = "User ID") @PathVariable Long id) {
        adminService.banUser(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{id}/unban")
    @Operation(summary = "Unban a user",
            description = "Restores the user's active flag to true.")
    @ApiResponse(responseCode = "204", description = "User unbanned")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not an admin",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "User not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Void> unbanUser(
            @Parameter(description = "User ID") @PathVariable Long id) {
        adminService.unbanUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/disputes")
    @Operation(summary = "List pending disputes",
            description = "Returns paginated list of service requests with DISPUTED status.")
    @ApiResponse(responseCode = "200", description = "Page of disputes")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not an admin",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Page<AdminDisputeResponse>> listDisputes(
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var result = adminService.listDisputes(pageable);
        return ResponseEntity.ok(result);
    }
}
