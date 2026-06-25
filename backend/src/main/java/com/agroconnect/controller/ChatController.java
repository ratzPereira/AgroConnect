package com.agroconnect.controller;

import com.agroconnect.dto.request.SendMessageDto;
import com.agroconnect.dto.response.ChatMessageResponse;
import com.agroconnect.exception.GlobalExceptionHandler.ErrorResponse;
import com.agroconnect.security.UserPrincipal;
import com.agroconnect.service.ChatService;
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
@RequestMapping("/v1/requests/{requestId}/messages")
@RequiredArgsConstructor
@Tag(name = "Chat", description = "Chat messages between client and provider for a service request")
public class ChatController {

    private final ChatService chatService;

    @GetMapping
    @Operation(summary = "Get chat messages",
            description = "Returns paginated chat messages for a request. Only the client and accepted provider can access.")
    @ApiResponse(responseCode = "200", description = "Page of messages")
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a participant in this request",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Request not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<Page<ChatMessageResponse>> getMessages(
            @Parameter(description = "Service request ID") @PathVariable Long requestId,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        var pageable = PageRequest.of(page, size);
        var result = chatService.getMessages(requestId, principal.getId(), principal.isAdmin(), pageable);
        return ResponseEntity.ok(result);
    }

    @PostMapping
    @Operation(summary = "Send a chat message",
            description = "Sends a message in the chat. Request must be in AWARDED through COMPLETED/DISPUTED status.")
    @ApiResponse(responseCode = "201", description = "Message sent")
    @ApiResponse(responseCode = "400", description = "Invalid input",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Not authenticated",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Not a participant",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Request not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "409", description = "Chat not available in current status",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<ChatMessageResponse> sendMessage(
            @Parameter(description = "Service request ID") @PathVariable Long requestId,
            @Valid @RequestBody SendMessageDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = chatService.sendMessage(requestId, dto, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
