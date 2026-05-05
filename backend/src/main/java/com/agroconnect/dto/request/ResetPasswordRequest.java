package com.agroconnect.dto.request;

import com.agroconnect.validation.ValidPassword;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request to reset password with token")
public record ResetPasswordRequest(
        @NotBlank(message = "O token é obrigatório")
        @Schema(description = "Password reset token from email")
        String token,

        @NotBlank(message = "A nova palavra-passe é obrigatória")
        @ValidPassword
        @Schema(description = "New password (min 8 chars, uppercase, lowercase, digit)")
        String newPassword
) {}
