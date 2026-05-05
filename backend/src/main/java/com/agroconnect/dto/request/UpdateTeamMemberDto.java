package com.agroconnect.dto.request;

import com.agroconnect.model.enums.TeamMemberRole;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

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
        TeamMemberRole role
) {}
