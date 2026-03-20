package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Dispute a service request awaiting confirmation")
public record DisputeRequestDto(

        @NotBlank
        @Size(min = 10, max = 1000)
        @Schema(description = "Reason for disputing the work")
        String reason
) {}
