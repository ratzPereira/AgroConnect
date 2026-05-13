package com.agroconnect.controller;

import com.agroconnect.dto.request.CreateInventoryItemDto;
import com.agroconnect.dto.request.RecordAdjustmentInDto;
import com.agroconnect.dto.request.RecordAdjustmentOutDto;
import com.agroconnect.dto.request.RecordPurchaseDto;
import com.agroconnect.dto.request.UpdateInventoryItemDto;
import com.agroconnect.dto.response.InventoryItemResponse;
import com.agroconnect.dto.response.InventoryMovementResponse;
import com.agroconnect.exception.GlobalExceptionHandler.ErrorResponse;
import com.agroconnect.security.UserPrincipal;
import com.agroconnect.service.InventoryMovementService;
import com.agroconnect.service.InventoryService;
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
@RequestMapping("/v1/providers/me/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory", description = "Manage provider inventory items and stock movements")
public class InventoryController {

    private final InventoryService inventoryService;
    private final InventoryMovementService inventoryMovementService;

    @GetMapping
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR')")
    @Operation(summary = "List inventory items",
            description = "Returns all inventory items for the authenticated provider (soft-deleted items excluded).")
    @ApiResponse(responseCode = "200", description = "List of inventory items")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<List<InventoryItemResponse>> list(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(inventoryService.listByProvider(principal.getId()));
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
        return ResponseEntity.ok(inventoryService.getLowStockItems(principal.getId()));
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
        return ResponseEntity.ok(inventoryService.getById(id, principal.getId()));
    }

    @PostMapping
    @PreAuthorize("hasRole('PROVIDER_MANAGER')")
    @Operation(summary = "Create inventory item",
            description = "Creates a new item. If quantity > 0, an INITIAL movement is appended to the ledger.")
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
    @Operation(summary = "Update inventory item metadata",
            description = "Updates rename / alert threshold. Quantity and cost are derived from the movement ledger.")
    @ApiResponse(responseCode = "200", description = "Item updated")
    @ApiResponse(responseCode = "400", description = "Invalid input",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a provider manager",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Item not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Duplicate product name on rename",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<InventoryItemResponse> update(
            @Parameter(description = "Inventory item ID") @PathVariable Long id,
            @Valid @RequestBody UpdateInventoryItemDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(inventoryService.update(id, dto, principal.getId()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PROVIDER_MANAGER')")
    @Operation(summary = "Soft-delete inventory item",
            description = "Marks the item as deleted. The ledger history is preserved.")
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

    // ─── Movement endpoints ────────────────────────────────────────────────

    @GetMapping("/{id}/movements")
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR')")
    @Operation(summary = "List movements for an item",
            description = "Returns the ledger of movements (most recent first) for the given item.")
    @ApiResponse(responseCode = "200", description = "Page of movements")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Item not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Page<InventoryMovementResponse>> listMovements(
            @Parameter(description = "Inventory item ID") @PathVariable Long id,
            @ParameterObject @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(inventoryMovementService.listForItem(id, principal.getId(), pageable));
    }

    @PostMapping("/{id}/movements/purchase")
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD')")
    @Operation(summary = "Record a PURCHASE movement",
            description = "Adds stock at a paid unit cost and recomputes the weighted-average cost.")
    @ApiResponse(responseCode = "201", description = "Movement recorded")
    @ApiResponse(responseCode = "400", description = "Invalid input",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Insufficient role",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Item not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Item is deleted",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<InventoryMovementResponse> recordPurchase(
            @Parameter(description = "Inventory item ID") @PathVariable Long id,
            @Valid @RequestBody RecordPurchaseDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = inventoryMovementService.recordPurchase(id, dto, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/movements/adjustment-in")
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD')")
    @Operation(summary = "Record an ADJUSTMENT_IN movement",
            description = "Manual addition (correction, gift, found stock). Optionally updates WAC if unit cost is provided.")
    @ApiResponse(responseCode = "201", description = "Movement recorded")
    @ApiResponse(responseCode = "400", description = "Invalid input",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Insufficient role",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Item not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Item is deleted",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<InventoryMovementResponse> recordAdjustmentIn(
            @Parameter(description = "Inventory item ID") @PathVariable Long id,
            @Valid @RequestBody RecordAdjustmentInDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = inventoryMovementService.recordAdjustmentIn(id, dto, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/movements/adjustment-out")
    @PreAuthorize("hasAnyRole('PROVIDER_MANAGER', 'PROVIDER_LEAD')")
    @Operation(summary = "Record an ADJUSTMENT_OUT movement",
            description = "Manual removal (spoilage, theft, write-off). Preserves the weighted-average cost.")
    @ApiResponse(responseCode = "201", description = "Movement recorded")
    @ApiResponse(responseCode = "400", description = "Invalid input",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Insufficient role",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Item not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Insufficient stock or item is deleted",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<InventoryMovementResponse> recordAdjustmentOut(
            @Parameter(description = "Inventory item ID") @PathVariable Long id,
            @Valid @RequestBody RecordAdjustmentOutDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = inventoryMovementService.recordAdjustmentOut(id, dto, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
