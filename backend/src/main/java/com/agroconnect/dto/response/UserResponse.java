package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "User information")
public record UserResponse(

        @Schema(description = "User ID", example = "1")
        Long id,

        @Schema(description = "User email", example = "joao@example.pt")
        String email,

        @Schema(description = "User display name", example = "João Silva")
        String name,

        @Schema(description = "User role", example = "CLIENT")
        String role
) {}
