package com.agroconnect.dto.request;

import com.agroconnect.model.enums.TeamMemberRole;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@Schema(description = "Create a new team member")
public record CreateTeamMemberDto(

        @NotBlank
        @Size(max = 255)
        @Schema(description = "Full name of the team member", example = "Carlos Mendes")
        String name,

        @NotBlank
        @Email
        @Size(max = 255)
        @Schema(description = "Email address", example = "carlos@agro.pt")
        String email,

        @Size(max = 20)
        @Schema(description = "Phone number", example = "+351912345678")
        String phone,

        @NotNull
        @Schema(description = "Role within the team")
        TeamMemberRole role,

        @DecimalMin(value = "0.00", message = "A taxa horária não pode ser negativa.")
        @Digits(integer = 6, fraction = 2)
        @Schema(description = "Hourly rate in EUR used for labor cost (optional)", example = "12.50")
        BigDecimal hourlyRate
) {}
