package com.agroconnect.dto.response;

import com.agroconnect.model.enums.TeamMemberRole;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Team member details")
public record TeamMemberResponse(

        @Schema(description = "Team member ID") Long id,
        @Schema(description = "Full name") String name,
        @Schema(description = "Email address") String email,
        @Schema(description = "Phone number") String phone,
        @Schema(description = "Role") TeamMemberRole role,
        @Schema(description = "Whether the member is active") boolean active,
        @Schema(description = "When the member was invited") Instant invitedAt,
        @Schema(description = "When the member joined") Instant joinedAt
) {}
