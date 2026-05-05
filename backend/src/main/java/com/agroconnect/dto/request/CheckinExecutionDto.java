package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

@Schema(description = "GPS check-in data for execution")
public record CheckinExecutionDto(

        @NotNull
        @DecimalMin(value = "-90", message = "A latitude deve estar entre -90 e 90")
        @DecimalMax(value = "90", message = "A latitude deve estar entre -90 e 90")
        @Schema(description = "Check-in latitude")
        Double latitude,

        @NotNull
        @DecimalMin(value = "-180", message = "A longitude deve estar entre -180 e 180")
        @DecimalMax(value = "180", message = "A longitude deve estar entre -180 e 180")
        @Schema(description = "Check-in longitude")
        Double longitude
) {}
