package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Data for completing an execution")
public record CompleteExecutionDto(

        @Schema(description = "Notes about the work done")
        String notes,

        @Schema(description = "Materials used (JSON string)")
        String materialsUsed
) {}
