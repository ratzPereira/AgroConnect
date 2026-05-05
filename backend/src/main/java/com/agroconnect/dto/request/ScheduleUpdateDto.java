package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

@Schema(description = "Update execution scheduled dates")
public record ScheduleUpdateDto(

        @NotNull
        @Schema(description = "Scheduled start date")
        LocalDate scheduledDate,

        @NotNull
        @Schema(description = "Scheduled end date (>= scheduledDate)")
        LocalDate scheduledEndDate
) {}
