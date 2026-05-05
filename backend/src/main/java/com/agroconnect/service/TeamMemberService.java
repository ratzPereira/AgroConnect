package com.agroconnect.service;

import com.agroconnect.dto.request.CreateTeamMemberDto;
import com.agroconnect.dto.request.UpdateTeamMemberDto;
import com.agroconnect.dto.response.TeamMemberResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.mapper.TeamMemberMapper;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.TeamMember;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.TeamMemberRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeamMemberService {

    private static final Logger log = LoggerFactory.getLogger(TeamMemberService.class);

    private static final String ERR_TEAM_MEMBER_NOT_FOUND = "Membro de equipa não encontrado.";

    private final TeamMemberRepository teamMemberRepository;
    private final ProviderProfileRepository providerProfileRepository;

    public List<TeamMemberResponse> listByProvider(Long userId) {
        ProviderProfile provider = getProviderProfile(userId);
        return teamMemberRepository.findByProviderIdAndActiveTrue(provider.getId()).stream()
                .map(TeamMemberMapper::toResponse)
                .toList();
    }

    public TeamMemberResponse getById(Long id, Long userId) {
        ProviderProfile provider = getProviderProfile(userId);
        TeamMember member = teamMemberRepository.findByIdAndProviderId(id, provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException(ERR_TEAM_MEMBER_NOT_FOUND));
        return TeamMemberMapper.toResponse(member);
    }

    @Transactional
    public TeamMemberResponse create(CreateTeamMemberDto dto, Long userId) {
        ProviderProfile provider = getProviderProfile(userId);

        if (teamMemberRepository.existsByProviderIdAndEmail(provider.getId(), dto.email())) {
            throw new InvalidStateException("Já existe um membro de equipa com este email.");
        }

        TeamMember member = TeamMember.builder()
                .provider(provider)
                .name(dto.name())
                .email(dto.email())
                .phone(dto.phone())
                .role(dto.role())
                .active(true)
                .invitedAt(Instant.now())
                .build();

        member = teamMemberRepository.save(member);
        log.info("Team member {} created for provider {}", member.getId(), provider.getId());
        return TeamMemberMapper.toResponse(member);
    }

    @Transactional
    public TeamMemberResponse update(Long id, UpdateTeamMemberDto dto, Long userId) {
        ProviderProfile provider = getProviderProfile(userId);
        TeamMember member = teamMemberRepository.findByIdAndProviderId(id, provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException(ERR_TEAM_MEMBER_NOT_FOUND));

        member.setName(dto.name());
        member.setPhone(dto.phone());
        if (dto.role() != null) {
            member.setRole(dto.role());
        }

        member = teamMemberRepository.save(member);
        log.info("Team member {} updated", member.getId());
        return TeamMemberMapper.toResponse(member);
    }

    @Transactional
    public void deactivate(Long id, Long userId) {
        ProviderProfile provider = getProviderProfile(userId);
        TeamMember member = teamMemberRepository.findByIdAndProviderId(id, provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException(ERR_TEAM_MEMBER_NOT_FOUND));

        member.setActive(false);
        teamMemberRepository.save(member);
        log.info("Team member {} deactivated", member.getId());
    }

    private ProviderProfile getProviderProfile(Long userId) {
        return providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ForbiddenException("Perfil de prestador não encontrado."));
    }
}
