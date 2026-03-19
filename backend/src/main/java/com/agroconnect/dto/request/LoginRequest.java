package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "User login request")
public record LoginRequest(

        @NotBlank(message = "O email é obrigatório")
        @Email(message = "O email deve ser válido")
        @Schema(description = "User email address", example = "joao.silva@email.pt")
        String email,

        @NotBlank(message = "A palavra-passe é obrigatória")
        @Schema(description = "User password", example = "password123")
        String password
) {}
