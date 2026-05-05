package com.agroconnect.controller;

import com.agroconnect.dto.request.CreateInventoryItemDto;
import com.agroconnect.dto.request.UpdateInventoryItemDto;
import com.agroconnect.dto.response.InventoryItemResponse;
import com.agroconnect.exception.GlobalExceptionHandler.ErrorResponse;
import com.agroconnect.security.UserPrincipal;
import com.agroconnect.service.InventoryService;
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
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/v1/providers/me/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory", description = "Manage provider inventory items")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR')")
    @Operation(summary = "List inventory items",
            description = "Returns all inventory items for the authenticated provider.")
    @ApiResponse(responseCode = "200", description = "List of inventory items")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<List<InventoryItemResponse>> list(
            @AuthenticationPrincipal UserPrincipal principal) {
        var result = inventoryService.listByProvider(principal.getId());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR')")
    @Operation(summary = "List low stock items",
            description = "Returns items where quantity is at or below the alert threshold.")
    @ApiResponse(responseCode = "200", description = "List of low stock items")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<List<InventoryItemResponse>> lowStock(
            @AuthenticationPrincipal UserPrincipal principal) {
        var result = inventoryService.getLowStockItems(principal.getId());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR')")
    @Operation(summary = "Get inventory item details")
    @ApiResponse(responseCode = "200", description = "Item details")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Item not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<InventoryItemResponse> getById(
            @Parameter(description = "Inventory item ID") @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        var result = inventoryService.getById(id, principal.getId());
        return ResponseEntity.ok(result);
    }

    @PostMapping
    @PreAuthorize("hasRole('PROVIDER_MANAGER')")
    @Operation(summary = "Create inventory item")
    @ApiResponse(responseCode = "201", description = "Item created")
    @ApiResponse(responseCode = "400", description = "Invalid input",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Duplicate product name",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<InventoryItemResponse> create(
            @Valid @RequestBody CreateInventoryItemDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = inventoryService.create(dto, principal.getId());
        var location = URI.create("/v1/providers/me/inventory/" + response.id());
        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PROVIDER_MANAGER')")
    @Operation(summary = "Update inventory item")
    @ApiResponse(responseCode = "200", description = "Item updated")
    @ApiResponse(responseCode = "400", description = "Invalid input",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Item not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<InventoryItemResponse> update(
            @Parameter(description = "Inventory item ID") @PathVariable Long id,
            @Valid @RequestBody UpdateInventoryItemDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = inventoryService.update(id, dto, principal.getId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PROVIDER_MANAGER')")
    @Operation(summary = "Delete inventory item")
    @ApiResponse(responseCode = "204", description = "Item deleted")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Item not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Void> delete(
            @Parameter(description = "Inventory item ID") @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        inventoryService.delete(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
