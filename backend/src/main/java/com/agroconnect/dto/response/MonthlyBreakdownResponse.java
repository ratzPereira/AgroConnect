package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Monthly breakdown of finance metrics for one calendar year.")
public record MonthlyBreakdownResponse(
        @Schema(description = "Year") int year,
        @Schema(description = "Twelve entries, ordered January → December") List<MonthlyBreakdownEntry> months
) {}
