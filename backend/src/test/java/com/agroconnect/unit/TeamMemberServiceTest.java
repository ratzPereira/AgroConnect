package com.agroconnect.unit;

import com.agroconnect.dto.request.CreateTeamMemberDto;
import com.agroconnect.dto.request.UpdateTeamMemberDto;
import com.agroconnect.dto.response.TeamMemberResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.fixture.ExecutionFixture;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.TeamMember;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.TeamMemberRole;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.TeamMemberRepository;
import com.agroconnect.service.TeamMemberService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeamMemberServiceTest {

    @Mock private TeamMemberRepository teamMemberRepository;
    @Mock private ProviderProfileRepository providerProfileRepository;

    private TeamMemberService service;

    private User providerUser;
    private ProviderProfile providerProfile;
    private TeamMember teamMember;

    @BeforeEach
    void setUp() {
        service = new TeamMemberService(teamMemberRepository, providerProfileRepository);

        providerUser = UserFixture.aProviderUser().build();
        providerProfile = UserFixture.aProviderProfile().user(providerUser).build();
        teamMember = ExecutionFixture.aTeamMember().provider(providerProfile).build();
    }

    @Test
    void create_givenValidData_shouldCreateTeamMember() {
        CreateTeamMemberDto dto = new CreateTeamMemberDto("Carlos Mendes", "carlos@agro.pt", "+351912345678", TeamMemberRole.OPERATOR);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(teamMemberRepository.existsByProviderIdAndEmail(1L, "carlos@agro.pt")).thenReturn(false);
        when(teamMemberRepository.save(any(TeamMember.class))).thenReturn(teamMember);

        TeamMemberResponse response = service.create(dto, 2L);

        assertNotNull(response);
        verify(teamMemberRepository).save(any(TeamMember.class));
    }

    @Test
    void create_givenDuplicateEmail_shouldThrowInvalidState() {
        CreateTeamMemberDto dto = new CreateTeamMemberDto("Carlos Mendes", "carlos@agro.pt", null, TeamMemberRole.OPERATOR);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(teamMemberRepository.existsByProviderIdAndEmail(1L, "carlos@agro.pt")).thenReturn(true);

        assertThrows(InvalidStateException.class, () -> service.create(dto, 2L));
    }

    @Test
    void update_givenValidData_shouldUpdateFields() {
        UpdateTeamMemberDto dto = new UpdateTeamMemberDto("Manuel Santos Jr", "+351913111111", TeamMemberRole.LEAD);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(teamMemberRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(teamMember));
        when(teamMemberRepository.save(any(TeamMember.class))).thenReturn(teamMember);

        TeamMemberResponse response = service.update(1L, dto, 2L);

        assertNotNull(response);
        verify(teamMemberRepository).save(any(TeamMember.class));
    }

    @Test
    void deactivate_givenValidId_shouldSetInactive() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(teamMemberRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(teamMember));

        service.deactivate(1L, 2L);

        assertFalse(teamMember.isActive());
        verify(teamMemberRepository).save(teamMember);
    }

    @Test
    void getById_givenWrongProvider_shouldThrowForbidden() {
        when(providerProfileRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThrows(ForbiddenException.class, () -> service.getById(1L, 99L));
    }
}
