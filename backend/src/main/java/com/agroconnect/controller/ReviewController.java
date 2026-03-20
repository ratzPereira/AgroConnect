package com.agroconnect.controller;

import com.agroconnect.dto.request.CreateReviewDto;
import com.agroconnect.dto.response.ReviewResponse;
import com.agroconnect.exception.GlobalExceptionHandler.ErrorResponse;
import com.agroconnect.security.UserPrincipal;
import com.agroconnect.service.ReviewService;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "Manage service reviews and ratings")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/requests/{id}/reviews")
    @Operation(summary = "Submit a review for a completed service",
            description = "Submits a review. Both client and provider can review each other. When both have reviewed, request transitions to RATED.")
    @ApiResponse(responseCode = "201", description = "Review created")
    @ApiResponse(responseCode = "400", description = "Invalid input (rating or comment too short)",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a participant in this service",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Request not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Already reviewed or invalid state",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ReviewResponse> create(
            @Parameter(description = "Service request ID") @PathVariable Long id,
            @Valid @RequestBody CreateReviewDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = reviewService.create(id, dto, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/requests/{id}/reviews")
    @Operation(summary = "Get reviews for a service request",
            description = "Returns all reviews submitted for a specific service request (max 2: one from client, one from provider).")
    @ApiResponse(responseCode = "200", description = "List of reviews")
    @ApiResponse(responseCode = "404", description = "Request not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<java.util.List<ReviewResponse>> getRequestReviews(
            @Parameter(description = "Service request ID") @PathVariable Long id) {
        var result = reviewService.getRequestReviews(id);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/providers/{id}/reviews")
    @Operation(summary = "Get provider reviews",
            description = "Returns paginated list of reviews for a provider. Public endpoint.")
    @ApiResponse(responseCode = "200", description = "Page of reviews")
    @ApiResponse(responseCode = "404", description = "Provider not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Page<ReviewResponse>> getProviderReviews(
            @Parameter(description = "Provider profile ID") @PathVariable Long id,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var result = reviewService.getProviderReviews(id, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/users/me/reviews")
    @Operation(summary = "Get my received reviews",
            description = "Returns paginated list of reviews where the authenticated user is the target.")
    @ApiResponse(responseCode = "200", description = "Page of reviews")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Page<ReviewResponse>> getMyReviews(
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var result = reviewService.getMyReceivedReviews(principal.getId(), pageable);
        return ResponseEntity.ok(result);
    }
}
