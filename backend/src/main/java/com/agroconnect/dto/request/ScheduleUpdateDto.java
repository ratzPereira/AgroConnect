package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

@Schema(description = "Update execution scheduled dates and optional time-of-day window")
public record ScheduleUpdateDto(

        @NotNull
        @Schema(description = "Scheduled start date")
        LocalDate scheduledDate,

        @NotNull
        @Schema(description = "Scheduled end date (>= scheduledDate)")
        LocalDate scheduledEndDate,

        @Schema(description = "Scheduled start time (required when allDay = false, must be null when allDay = true)")
        LocalTime scheduledStartTime,

        @Schema(description = "Scheduled end time (required when allDay = false, must be > start time)")
        LocalTime scheduledEndTime,

        @Schema(description = "Whether the event spans the whole day(s); defaults to true when omitted")
        Boolean allDay
) {}
