package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "GPS check-in data for execution")
public record CheckinExecutionDto(

        @NotNull
        @Schema(description = "Check-in latitude")
        Double latitude,

        @NotNull
        @Schema(description = "Check-in longitude")
        Double longitude
) {}
