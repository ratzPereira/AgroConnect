package com.agroconnect.dto.response;

import com.agroconnect.model.enums.Role;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Admin view of a user")
public record AdminUserResponse(

        @Schema(description = "User ID") Long id,
        @Schema(description = "Display name") String name,
        @Schema(description = "Email") String email,
        @Schema(description = "Role") Role role,
        @Schema(description = "Whether the user is active") boolean active,
        @Schema(description = "Registration date") Instant createdAt,
        @Schema(description = "Number of requests (if client)") long requestCount,
        @Schema(description = "Number of proposals (if provider)") long proposalCount
) {}
