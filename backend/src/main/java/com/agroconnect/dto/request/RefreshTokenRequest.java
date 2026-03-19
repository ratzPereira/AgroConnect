package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Refresh token request")
public record RefreshTokenRequest(

        @NotBlank(message = "O refresh token é obrigatório")
        @Schema(description = "Refresh token received during login/register")
        String refreshToken
) {}
