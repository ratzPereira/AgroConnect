package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

@Schema(description = "Update provider profile request")
public record UpdateProviderProfileRequest(

        @Size(min = 2, max = 255, message = "O nome da empresa deve ter entre 2 e 255 caracteres")
        @Schema(description = "Company name", example = "AgroServiços Terceira Lda")
        String companyName,

        @Size(max = 20, message = "O NIF deve ter no máximo 20 caracteres")
        @Schema(description = "Tax identification number", example = "123456789")
        String nif,

        @Schema(description = "Phone number", example = "+351912345678")
        String phone,

        @Size(max = 1000, message = "A descrição deve ter no máximo 1000 caracteres")
        @Schema(description = "Company description / bio", example = "Serviços agrícolas na ilha Terceira")
        String description,

        @Positive(message = "O raio de serviço deve ser positivo")
        @Schema(description = "Service radius in kilometers", example = "30")
        Double serviceRadiusKm,

        @Schema(description = "Location latitude (WGS84)", example = "38.6667")
        Double latitude,

        @Schema(description = "Location longitude (WGS84)", example = "-27.2167")
        Double longitude
) {}
