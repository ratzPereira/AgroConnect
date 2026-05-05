package com.agroconnect.dto.request;

import com.agroconnect.model.enums.Urgency;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@Schema(description = "Request to create a new service request")
public record CreateServiceRequestDto(

        @NotNull(message = "A categoria é obrigatória")
        @Schema(description = "Service category ID", example = "1")
        Long categoryId,

        @NotBlank(message = "O título é obrigatório")
        @Size(max = 255, message = "O título não pode exceder 255 caracteres")
        @Schema(description = "Brief title for the request", example = "Lavoura de terreno para plantação")
        String title,

        @NotBlank(message = "A descrição é obrigatória")
        @Schema(description = "Detailed description of the service needed", example = "Necessito de lavoura profunda em terreno de 2 hectares")
        String description,

        @NotNull(message = "A latitude é obrigatória")
        @DecimalMin(value = "36.9", message = "A latitude deve estar dentro dos Açores")
        @DecimalMax(value = "39.8", message = "A latitude deve estar dentro dos Açores")
        @Schema(description = "Location latitude (Azores: 36.9–39.8)", example = "38.7167")
        Double latitude,

        @NotNull(message = "A longitude é obrigatória")
        @DecimalMin(value = "-31.3", message = "A longitude deve estar dentro dos Açores")
        @DecimalMax(value = "-24.7", message = "A longitude deve estar dentro dos Açores")
        @Schema(description = "Location longitude (Azores: -31.3 to -24.7)", example = "-27.2167")
        Double longitude,

        @Schema(description = "Parish name", example = "São Sebastião")
        String parish,

        @NotBlank(message = "O município é obrigatório")
        @Schema(description = "Municipality name", example = "Angra do Heroísmo")
        String municipality,

        @NotBlank(message = "A ilha é obrigatória")
        @Schema(description = "Island name", example = "Terceira")
        String island,

        @Positive(message = "A área deve ser positiva")
        @Schema(description = "Approximate area", example = "2.5")
        Double area,

        @Schema(description = "Area unit", example = "hectares", allowableValues = {"hectares", "m2", "alqueires"})
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
