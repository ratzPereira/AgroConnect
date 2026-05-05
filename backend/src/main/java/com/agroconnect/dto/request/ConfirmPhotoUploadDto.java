package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Confirm a photo upload by providing the public URL")
public record ConfirmPhotoUploadDto(

        @NotBlank(message = "O URL da foto é obrigatório.")
        @Size(max = 500, message = "O URL da foto não pode exceder 500 caracteres.")
        @Schema(description = "Public URL of the uploaded photo", example = "https://minio.agroconnect.pt/agroconnect/listings/1/abc123.jpg")
        String photoUrl
) {}
