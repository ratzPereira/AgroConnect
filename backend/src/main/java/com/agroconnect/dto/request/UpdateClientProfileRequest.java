package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

@Schema(description = "Update client profile request")
public record UpdateClientProfileRequest(

        @Size(min = 2, max = 255, message = "O nome deve ter entre 2 e 255 caracteres")
        @Schema(description = "Client full name", example = "João Silva")
        String name,

        @Schema(description = "Phone number", example = "+351912345678")
        String phone,

        @Size(max = 255, message = "A freguesia deve ter no máximo 255 caracteres")
        @Schema(description = "Parish name", example = "Angra do Heroísmo")
        String parish,

        @Size(max = 255, message = "O município deve ter no máximo 255 caracteres")
        @Schema(description = "Municipality name", example = "Angra do Heroísmo")
        String municipality,

        @Size(max = 100, message = "A ilha deve ter no máximo 100 caracteres")
        @Schema(description = "Island name", example = "Terceira")
        String island,

        @Schema(description = "Location latitude (WGS84)", example = "38.6667")
        Double latitude,

        @Schema(description = "Location longitude (WGS84)", example = "-27.2167")
        Double longitude
) {}
