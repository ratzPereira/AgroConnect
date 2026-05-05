package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Send a chat message")
public record SendMessageDto(

        @NotBlank
        @Size(max = 2000)
        @Schema(description = "Message content", example = "Bom dia, gostaria de confirmar a data do serviço.")
        String content
) {}
