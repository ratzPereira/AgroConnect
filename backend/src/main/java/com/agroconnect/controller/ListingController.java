package com.agroconnect.controller;

import com.agroconnect.dto.request.ConfirmPhotoUploadDto;
import com.agroconnect.dto.request.CreateListingDto;
import com.agroconnect.dto.request.SendListingMessageDto;
import com.agroconnect.dto.request.UpdateListingDto;
import com.agroconnect.dto.response.ListingConversationResponse;
import com.agroconnect.dto.response.ListingMessageResponse;
import com.agroconnect.dto.response.ListingResponse;
import com.agroconnect.dto.response.ListingStatsResponse;
import com.agroconnect.dto.response.ListingSummaryResponse;
import com.agroconnect.dto.response.PresignedUrlResponse;
import com.agroconnect.exception.GlobalExceptionHandler.ErrorResponse;
import com.agroconnect.security.UserPrincipal;
import com.agroconnect.service.ListingMessageService;
import com.agroconnect.service.ListingService;
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
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

import java.math.BigDecimal;
import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/v1/listings")
@RequiredArgsConstructor
@Tag(name = "Marketplace Listings", description = "Buy and sell agricultural products, animals, and equipment")
public class ListingController {

    private final ListingService listingService;
    private final ListingMessageService listingMessageService;

    @GetMapping
    @Operation(
            summary = "Search marketplace listings",
            description = "Returns paginated active listings with optional filters. No authentication required."
    )
    @ApiResponse(responseCode = "200", description = "Page of listing summaries")
    public ResponseEntity<Page<ListingSummaryResponse>> search(
            @Parameter(description = "Filter by category (ANIMALS, PLANTS, SEEDS, PRODUCE, EQUIPMENT)")
            @RequestParam(required = false) String category,
            @Parameter(description = "Filter by island name")
            @RequestParam(required = false) String island,
            @Parameter(description = "Search text in title and description")
            @RequestParam(required = false) String q,
            @Parameter(description = "Minimum price filter")
            @RequestParam(required = false) BigDecimal minPrice,
            @Parameter(description = "Maximum price filter")
            @RequestParam(required = false) BigDecimal maxPrice,
            @Parameter(description = "Latitude for distance filter")
            @RequestParam(required = false) Double lat,
            @Parameter(description = "Longitude for distance filter")
            @RequestParam(required = false) Double lng,
            @Parameter(description = "Radius in km for distance filter")
            @RequestParam(required = false) Double radius,
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        var criteria = new ListingService.ListingSearchCriteria(
                category, island, q, minPrice, maxPrice, lat, lng, radius);
        var result = listingService.search(criteria, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Get listing details",
            description = "Returns full details of a listing. Increments view count if viewer is not the seller. Authentication optional."
    )
    @ApiResponse(responseCode = "200", description = "Listing details")
    @ApiResponse(responseCode = "404", description = "Listing not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ListingResponse> getById(
            @Parameter(description = "Listing ID") @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long currentUserId = principal != null ? principal.getId() : null;
        var result = listingService.findById(id, currentUserId);
        return ResponseEntity.ok(result);
    }

    @PostMapping
    @Operation(
            summary = "Create a new listing",
            description = "Creates a new marketplace listing. Requires authentication."
    )
    @ApiResponse(responseCode = "201", description = "Listing created successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input data",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ListingResponse> create(
            @Valid @RequestBody CreateListingDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = listingService.create(dto, principal.getId());
        var location = URI.create("/v1/listings/" + response.id());
        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{id}")
    @Operation(
            summary = "Update a listing",
            description = "Updates an existing listing. Only the seller can update. Listing must be in ACTIVE or DRAFT status."
    )
    @ApiResponse(responseCode = "200", description = "Listing updated successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input data",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not the listing owner",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Listing not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Listing not in editable status",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ListingResponse> update(
            @Parameter(description = "Listing ID") @PathVariable Long id,
            @Valid @RequestBody UpdateListingDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = listingService.update(id, dto, principal.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/sold")
    @Operation(
            summary = "Mark listing as sold",
            description = "Marks an active listing as sold. Only the seller can perform this action."
    )
    @ApiResponse(responseCode = "200", description = "Listing marked as sold")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not the listing owner",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Listing not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Listing not in ACTIVE status",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ListingResponse> markAsSold(
            @Parameter(description = "Listing ID") @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = listingService.markAsSold(id, principal.getId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(
            summary = "Remove a listing",
            description = "Removes a listing. The seller or an admin can perform this action."
    )
    @ApiResponse(responseCode = "200", description = "Listing removed")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not the owner or admin",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Listing not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ListingResponse> remove(
            @Parameter(description = "Listing ID") @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = listingService.remove(id, principal.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @Operation(
            summary = "Get my listings",
            description = "Returns the authenticated user's own listings, optionally filtered by status."
    )
    @ApiResponse(responseCode = "200", description = "Page of listing summaries")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Page<ListingSummaryResponse>> myListings(
            @Parameter(description = "Filter by status (DRAFT, ACTIVE, SOLD, EXPIRED, REMOVED)")
            @RequestParam(required = false) String status,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        Pageable pageable = PageRequest.of(page, size);
        var result = listingService.findBySeller(principal.getId(), status, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/me/stats")
    @Operation(
            summary = "Get my listing statistics",
            description = "Returns statistics about the authenticated user's listings."
    )
    @ApiResponse(responseCode = "200", description = "Listing statistics")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ListingStatsResponse> myStats(
            @AuthenticationPrincipal UserPrincipal principal) {
        var result = listingService.getSellerStats(principal.getId());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/photos/upload-url")
    @Operation(
            summary = "Generate photo upload URL",
            description = "Generates a presigned URL for uploading a photo to the listing. Max 8 photos per listing."
    )
    @ApiResponse(responseCode = "200", description = "Presigned upload URL")
    @ApiResponse(responseCode = "400", description = "Maximum photo count reached",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not the listing owner",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Listing not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<PresignedUrlResponse> generatePhotoUploadUrl(
            @Parameter(description = "Listing ID") @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        var result = listingService.generatePhotoUploadUrl(id, principal.getId());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/photos")
    @Operation(
            summary = "Confirm photo upload",
            description = "Confirms that a photo has been uploaded and adds it to the listing."
    )
    @ApiResponse(responseCode = "201", description = "Photo added to listing")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not the listing owner",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Listing not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Void> confirmPhotoUpload(
            @Parameter(description = "Listing ID") @PathVariable Long id,
            @Valid @RequestBody ConfirmPhotoUploadDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        listingService.confirmPhotoUpload(id, dto.photoUrl(), principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{id}/photos/{photoId}")
    @Operation(
            summary = "Delete a listing photo",
            description = "Removes a photo from the listing. Only the seller can delete photos."
    )
    @ApiResponse(responseCode = "204", description = "Photo deleted")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not the listing owner",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Listing or photo not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Void> deletePhoto(
            @Parameter(description = "Listing ID") @PathVariable Long id,
            @Parameter(description = "Photo ID") @PathVariable Long photoId,
            @AuthenticationPrincipal UserPrincipal principal) {
        listingService.deletePhoto(id, photoId, principal.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/favorite")
    @Operation(
            summary = "Toggle listing favorite",
            description = "Adds or removes a listing from the user's favorites. Returns the new favorited state."
    )
    @ApiResponse(responseCode = "200", description = "Favorite toggled successfully")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Listing not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Map<String, Boolean>> toggleFavorite(
            @Parameter(description = "Listing ID") @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean favorited = listingService.toggleFavorite(id, principal.getId());
        return ResponseEntity.ok(Map.of("favorited", favorited));
    }

    @GetMapping("/favorites")
    @Operation(
            summary = "Get my favorite listings",
            description = "Returns the authenticated user's favorited listings."
    )
    @ApiResponse(responseCode = "200", description = "Page of favorite listing summaries")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Page<ListingSummaryResponse>> myFavorites(
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        Pageable pageable = PageRequest.of(page, size);
        var result = listingService.getFavorites(principal.getId(), pageable);
        return ResponseEntity.ok(result);
    }

    // ---- Messaging endpoints ----

    @PostMapping("/{id}/messages")
    @Operation(
            summary = "Send first message to listing seller",
            description = "Initiates a conversation with the seller about a listing. Creates a new conversation if one does not exist. Seller cannot message their own listing."
    )
    @ApiResponse(responseCode = "201", description = "Message sent successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Cannot message own listing",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Listing not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Listing not in ACTIVE status",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ListingMessageResponse> sendFirstMessage(
            @Parameter(description = "Listing ID") @PathVariable Long id,
            @Valid @RequestBody SendListingMessageDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = listingMessageService.sendFirstMessage(id, dto, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/conversations")
    @Operation(
            summary = "Get my listing conversations",
            description = "Returns the authenticated user's listing conversations (both as seller and buyer)."
    )
    @ApiResponse(responseCode = "200", description = "Page of conversations")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Page<ListingConversationResponse>> myConversations(
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        Pageable pageable = PageRequest.of(page, size);
        var result = listingMessageService.getMyConversations(principal.getId(), pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/conversations/{convId}")
    @Operation(
            summary = "Get conversation messages",
            description = "Returns paginated messages for a specific listing conversation. Only participants can access."
    )
    @ApiResponse(responseCode = "200", description = "Page of messages")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a participant in this conversation",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Conversation not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Page<ListingMessageResponse>> getConversationMessages(
            @Parameter(description = "Conversation ID") @PathVariable Long convId,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        Pageable pageable = PageRequest.of(page, size);
        var result = listingMessageService.getConversationMessages(convId, principal.getId(), pageable);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/conversations/{convId}/messages")
    @Operation(
            summary = "Reply in a conversation",
            description = "Sends a reply message in an existing listing conversation. Both seller and buyer can reply."
    )
    @ApiResponse(responseCode = "201", description = "Reply sent successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a participant in this conversation",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Conversation not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ListingMessageResponse> replyToConversation(
            @Parameter(description = "Conversation ID") @PathVariable Long convId,
            @Valid @RequestBody SendListingMessageDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = listingMessageService.replyToConversation(convId, dto, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/conversations/{convId}/read")
    @Operation(
            summary = "Mark conversation as read",
            description = "Marks all unread messages from the other party in this conversation as read."
    )
    @ApiResponse(responseCode = "204", description = "Messages marked as read")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a participant in this conversation",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Conversation not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Void> markAsRead(
            @Parameter(description = "Conversation ID") @PathVariable Long convId,
            @AuthenticationPrincipal UserPrincipal principal) {
        listingMessageService.markAsRead(convId, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
