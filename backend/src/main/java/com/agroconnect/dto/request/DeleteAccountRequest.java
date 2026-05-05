package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request to delete the authenticated user's account")
public record DeleteAccountRequest(
        @NotBlank(message = "A palavra-passe é obrigatória.")
        @Schema(description = "Current password for confirmation")
        String password
) {}
