package com.agroconnect.dto.request;

import com.agroconnect.model.enums.Urgency;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@Schema(description = "Request to update a service request (DRAFT only)")
public record UpdateServiceRequestDto(

        @Schema(description = "Service category ID", example = "1")
        Long categoryId,

        @Size(max = 255, message = "O título não pode exceder 255 caracteres")
        @Schema(description = "Brief title for the request", example = "Lavoura de terreno para plantação")
        String title,

        @Schema(description = "Detailed description", example = "Necessito de lavoura profunda")
        String description,

        @Schema(description = "Location latitude", example = "38.7167")
        Double latitude,

        @Schema(description = "Location longitude", example = "-27.2167")
        Double longitude,

        @Schema(description = "Parish name", example = "São Sebastião")
        String parish,

        @Schema(description = "Municipality name", example = "Angra do Heroísmo")
        String municipality,

        @Schema(description = "Island name", example = "Terceira")
        String island,

        @Positive(message = "A área deve ser positiva")
        @Schema(description = "Approximate area", example = "2.5")
        Double area,

        @Schema(description = "Area unit", example = "hectares")
        String areaUnit,

        @Schema(description = "Urgency level", example = "MEDIUM")
        Urgency urgency,

        @Schema(description = "Preferred start date", example = "2026-04-01")
        LocalDate preferredDateFrom,

        @Schema(description = "Preferred end date", example = "2026-04-15")
        LocalDate preferredDateTo,

        @Schema(description = "Dynamic form data as JSON string")
        String formData
) {}
