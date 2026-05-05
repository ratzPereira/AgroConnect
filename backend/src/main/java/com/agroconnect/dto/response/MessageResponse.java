package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Generic success message response")
public record MessageResponse(
        @Schema(description = "Success message") String message
) {}
