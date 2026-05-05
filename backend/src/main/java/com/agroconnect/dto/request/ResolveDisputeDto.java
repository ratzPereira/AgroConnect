package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Admin resolution of a dispute")
public record ResolveDisputeDto(

        @NotNull
        @Schema(description = "Resolution action: RELEASE (pay provider) or REFUND (refund client)")
        Resolution resolution,

        @NotBlank
        @Schema(description = "Admin notes about the resolution")
        String notes
) {

    public enum Resolution {
        RELEASE,
        REFUND
    }
}
