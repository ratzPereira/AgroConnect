package com.agroconnect.controller;

import com.agroconnect.dto.request.CreateMachineDto;
import com.agroconnect.dto.request.UpdateMachineDto;
import com.agroconnect.dto.response.MachineResponse;
import com.agroconnect.exception.GlobalExceptionHandler.ErrorResponse;
import com.agroconnect.model.enums.MachineStatus;
import com.agroconnect.security.UserPrincipal;
import com.agroconnect.service.MachineService;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/v1/providers/me/machines")
@RequiredArgsConstructor
@Tag(name = "Machines", description = "Manage provider machines and equipment")
public class MachineController {

    private final MachineService machineService;

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
}
