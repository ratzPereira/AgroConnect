package com.agroconnect.dto.request;

import com.agroconnect.model.enums.TeamMemberRole;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@Schema(description = "Update an existing team member (email is immutable)")
public record UpdateTeamMemberDto(

        @NotBlank
        @Size(max = 255)
        @Schema(description = "Full name")
        String name,

        @Size(max = 20)
        @Schema(description = "Phone number")
        String phone,

        @Schema(description = "Role within the team")
        TeamMemberRole role,

        @DecimalMin(value = "0.00", message = "A taxa horária não pode ser negativa.")
        @Digits(integer = 6, fraction = 2)
        @Schema(description = "Hourly rate in EUR (null clears the rate)")
        BigDecimal hourlyRate
) {}
