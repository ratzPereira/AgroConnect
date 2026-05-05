package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Send a message about a listing")
public record SendListingMessageDto(

        @NotBlank(message = "A mensagem não pode estar vazia.")
        @Size(max = 2000, message = "A mensagem não pode exceder 2000 caracteres.")
        @Schema(description = "Message content", example = "Bom dia, o animal ainda está disponível?")
        String content
) {}
