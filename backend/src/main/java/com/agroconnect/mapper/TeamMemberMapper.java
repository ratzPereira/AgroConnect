package com.agroconnect.mapper;

import com.agroconnect.dto.response.TeamMemberResponse;
import com.agroconnect.model.TeamMember;

public final class TeamMemberMapper {

    private TeamMemberMapper() {}

    public static TeamMemberResponse toResponse(TeamMember member) {
        return new TeamMemberResponse(
                member.getId(),
                member.getName(),
                member.getEmail(),
                member.getPhone(),
                member.getRole(),
                member.isActive(),
                member.getInvitedAt(),
                member.getJoinedAt(),
                member.getHourlyRate()
        );
    }
}
