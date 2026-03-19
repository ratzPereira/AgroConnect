package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "User registration request")
public record RegisterRequest(

        @NotBlank(message = "O email é obrigatório")
        @Email(message = "O email deve ser válido")
        @Schema(description = "User email address", example = "joao@example.pt")
        String email,

        @NotBlank(message = "A palavra-passe é obrigatória")
        @Size(min = 8, max = 100, message = "A palavra-passe deve ter entre 8 e 100 caracteres")
        @Schema(description = "User password (min 8 characters)", example = "password123")
        String password,

        @NotBlank(message = "A confirmação da palavra-passe é obrigatória")
        @Schema(description = "Password confirmation (must match password)", example = "password123")
        String confirmPassword,

        @NotBlank(message = "O nome é obrigatório")
        @Size(min = 2, max = 255, message = "O nome deve ter entre 2 e 255 caracteres")
        @Schema(description = "User full name", example = "João Silva")
        String name,

        @Schema(description = "Phone number", example = "+351912345678")
        String phone,

        @NotNull(message = "O papel é obrigatório")
        @Pattern(regexp = "CLIENT|PROVIDER_MANAGER", message = "O papel deve ser CLIENT ou PROVIDER_MANAGER")
        @Schema(description = "User role", allowableValues = {"CLIENT", "PROVIDER_MANAGER"}, example = "CLIENT")
        String role,

        @Schema(description = "Company name (required for PROVIDER_MANAGER)", example = "AgroServiços Lda")
        String companyName,

        @Schema(description = "Tax identification number (required for PROVIDER_MANAGER)", example = "123456789")
        String nif
) {}
