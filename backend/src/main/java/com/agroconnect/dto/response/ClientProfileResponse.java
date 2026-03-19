package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Client profile information")
public record ClientProfileResponse(

        @Schema(description = "Profile ID", example = "1")
        Long id,

        @Schema(description = "Client full name", example = "João Silva")
        String name,

        @Schema(description = "Phone number", example = "+351912345678")
        String phone,

        @Schema(description = "Parish name", example = "Angra do Heroísmo")
        String parish,

        @Schema(description = "Municipality name", example = "Angra do Heroísmo")
        String municipality,

        @Schema(description = "Island name", example = "Terceira")
        String island,

        @Schema(description = "Location latitude", example = "38.6667")
        Double latitude,

        @Schema(description = "Location longitude", example = "-27.2167")
        Double longitude
) {}
