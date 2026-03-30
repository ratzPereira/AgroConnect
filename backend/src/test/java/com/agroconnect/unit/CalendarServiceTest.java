package com.agroconnect.unit;

import com.agroconnect.dto.request.ScheduleUpdateDto;
import com.agroconnect.dto.response.CalendarEventResponse;
import com.agroconnect.dto.response.ConflictResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.ValidationException;
import com.agroconnect.model.ExecutionAssignment;
import com.agroconnect.model.Machine;
import com.agroconnect.model.Proposal;
import com.agroconnect.model.ServiceCategory;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.ServiceExecution;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.TeamMember;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.model.enums.TeamMemberRole;
import com.agroconnect.model.enums.Urgency;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.ServiceExecutionRepository;
import com.agroconnect.service.CalendarService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CalendarServiceTest {

    @Mock
    private ServiceExecutionRepository executionRepository;

    @Mock
    private ProviderProfileRepository providerProfileRepository;

    @InjectMocks
    private CalendarService calendarService;

    private ProviderProfile provider;
    private ServiceRequest request;
    private Proposal proposal;
    private ServiceExecution execution;
    private TeamMember teamMember;

    @BeforeEach
    void setUp() {
        provider = ProviderProfile.builder().id(1L).build();

        var category = com.agroconnect.model.ServiceCategory.builder()
                .id(1L).name("Limpeza de terreno").build();

        request = ServiceRequest.builder()
                .id(10L)
                .title("Limpeza parcela norte")
                .category(category)
                .status(RequestStatus.AWARDED)
                .island("São Miguel")
                .parish("Ponta Delgada")
                .urgency(Urgency.MEDIUM)
                .build();

        proposal = Proposal.builder()
                .id(5L)
                .provider(provider)
                .request(request)
                .build();

        teamMember = TeamMember.builder()
                .id(1L)
                .name("João Silva")
                .role(TeamMemberRole.OPERATOR)
                .provider(provider)
                .build();

        execution = ServiceExecution.builder()
                .id(100L)
                .proposal(proposal)
                .scheduledDate(LocalDate.of(2026, 4, 1))
                .scheduledEndDate(LocalDate.of(2026, 4, 3))
                .assignments(Set.of(
                        ExecutionAssignment.builder()
                                .id(1L)
                                .teamMember(teamMember)
                                .build()
                ))
                .build();
    }

    @Test
    void getCalendarEvents_shouldReturnEvents() {
        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findByProviderAndScheduledRange(eq(1L), any(), any()))
                .thenReturn(List.of(execution));

        List<CalendarEventResponse> events = calendarService.getCalendarEvents(
                1L, LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30));

        assertThat(events).hasSize(1);
        assertThat(events.get(0).requestTitle()).isEqualTo("Limpeza parcela norte");
        assertThat(events.get(0).scheduledDate()).isEqualTo(LocalDate.of(2026, 4, 1));
        assertThat(events.get(0).assignments()).hasSize(1);
        assertThat(events.get(0).assignments().get(0).teamMemberName()).isEqualTo("João Silva");
    }

    @Test
    void getConflicts_shouldDetectDoubleBooking() {
        // Two executions on the same dates with the same team member
        ServiceExecution execution2 = ServiceExecution.builder()
                .id(101L)
                .proposal(Proposal.builder()
                        .id(6L)
                        .provider(provider)
                        .request(ServiceRequest.builder()
                                .id(11L)
                                .title("Poda de árvores")
                                .category(com.agroconnect.model.ServiceCategory.builder()
                                        .id(2L).name("Poda").build())
                                .status(RequestStatus.AWARDED)
                                .island("São Miguel")
                                .parish("Ribeira Grande")
                                .urgency(Urgency.LOW)
                                .build())
                        .build())
                .scheduledDate(LocalDate.of(2026, 4, 2))
                .scheduledEndDate(LocalDate.of(2026, 4, 2))
                .assignments(Set.of(
                        ExecutionAssignment.builder()
                                .id(2L)
                                .teamMember(teamMember) // same team member
                                .build()
                ))
                .build();

        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findByProviderAndScheduledRange(eq(1L), any(), any()))
                .thenReturn(List.of(execution, execution2));

        List<ConflictResponse> conflicts = calendarService.getConflicts(
                1L, LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30));

        assertThat(conflicts).isNotEmpty();
        assertThat(conflicts.get(0).resourceType()).isEqualTo("TEAM_MEMBER");
        assertThat(conflicts.get(0).resourceName()).isEqualTo("João Silva");
        assertThat(conflicts.get(0).conflictingEvents()).hasSize(2);
    }

    @Test
    void updateSchedule_shouldUpdateDates() {
        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findById(100L)).thenReturn(Optional.of(execution));
        when(executionRepository.save(any())).thenReturn(execution);

        ScheduleUpdateDto dto = new ScheduleUpdateDto(
                LocalDate.of(2026, 4, 5), LocalDate.of(2026, 4, 7));

        CalendarEventResponse result = calendarService.updateSchedule(100L, dto, 1L);

        verify(executionRepository).save(execution);
        assertThat(execution.getScheduledDate()).isEqualTo(LocalDate.of(2026, 4, 5));
        assertThat(execution.getScheduledEndDate()).isEqualTo(LocalDate.of(2026, 4, 7));
    }

    @Test
    void updateSchedule_givenEndBeforeStart_shouldThrow() {
        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findById(100L)).thenReturn(Optional.of(execution));

        ScheduleUpdateDto dto = new ScheduleUpdateDto(
                LocalDate.of(2026, 4, 10), LocalDate.of(2026, 4, 5));

        assertThatThrownBy(() -> calendarService.updateSchedule(100L, dto, 1L))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void updateSchedule_givenWrongProvider_shouldThrow() {
        ProviderProfile otherProvider = ProviderProfile.builder().id(99L).build();
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(otherProvider));
        when(executionRepository.findById(100L)).thenReturn(Optional.of(execution));

        ScheduleUpdateDto dto = new ScheduleUpdateDto(
                LocalDate.of(2026, 4, 5), LocalDate.of(2026, 4, 7));

        assertThatThrownBy(() -> calendarService.updateSchedule(100L, dto, 2L))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void getCalendarEvents_givenNoProvider_shouldThrow() {
        when(providerProfileRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> calendarService.getCalendarEvents(99L,
                LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30)))
                .isInstanceOf(com.agroconnect.exception.ResourceNotFoundException.class);
    }

    @Test
    void getConflicts_givenNoConflicts_shouldReturnEmpty() {
        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findByProviderAndScheduledRange(eq(1L), any(), any()))
                .thenReturn(List.of(execution));

        // Single execution cannot conflict with itself
        List<ConflictResponse> conflicts = calendarService.getConflicts(
                1L, LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30));

        assertThat(conflicts).isEmpty();
    }

    @Test
    void getConflicts_givenMachineConflict_shouldDetect() {
        Machine machine = Machine.builder().id(1L).name("Trator JD").build();

        ServiceExecution exec1 = ServiceExecution.builder()
                .id(100L)
                .proposal(proposal)
                .scheduledDate(LocalDate.of(2026, 4, 1))
                .scheduledEndDate(LocalDate.of(2026, 4, 1))
                .assignments(Set.of(
                        ExecutionAssignment.builder().id(1L).teamMember(teamMember).machine(machine).build()
                ))
                .build();

        ServiceExecution exec2 = ServiceExecution.builder()
                .id(101L)
                .proposal(Proposal.builder().id(6L).provider(provider)
                        .request(ServiceRequest.builder().id(11L).title("Outro serviço")
                                .category(com.agroconnect.model.ServiceCategory.builder().id(2L).name("Poda").build())
                                .status(RequestStatus.AWARDED).island("São Miguel").parish("R. Grande")
                                .urgency(com.agroconnect.model.enums.Urgency.LOW).build())
                        .build())
                .scheduledDate(LocalDate.of(2026, 4, 1))
                .scheduledEndDate(LocalDate.of(2026, 4, 1))
                .assignments(Set.of(
                        ExecutionAssignment.builder().id(2L).teamMember(
                                TeamMember.builder().id(2L).name("Outro membro").role(TeamMemberRole.OPERATOR).provider(provider).build()
                        ).machine(machine).build()
                ))
                .build();

        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findByProviderAndScheduledRange(eq(1L), any(), any()))
                .thenReturn(List.of(exec1, exec2));

        List<ConflictResponse> conflicts = calendarService.getConflicts(
                1L, LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30));

        assertThat(conflicts).isNotEmpty();
        boolean hasMachineConflict = conflicts.stream()
                .anyMatch(c -> "MACHINE".equals(c.resourceType()));
        assertThat(hasMachineConflict).isTrue();
    }

    @Test
    void getCalendarEvents_givenAssignmentWithMachine_shouldIncludeMachineData() {
        Machine machine = Machine.builder().id(1L).name("Trator JD").build();
        ServiceExecution execWithMachine = ServiceExecution.builder()
                .id(100L)
                .proposal(proposal)
                .scheduledDate(LocalDate.of(2026, 4, 1))
                .scheduledEndDate(LocalDate.of(2026, 4, 3))
                .assignments(Set.of(
                        ExecutionAssignment.builder().id(1L).teamMember(teamMember).machine(machine).build()
                ))
                .build();

        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findByProviderAndScheduledRange(eq(1L), any(), any()))
                .thenReturn(List.of(execWithMachine));

        List<CalendarEventResponse> events = calendarService.getCalendarEvents(
                1L, LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30));

        assertThat(events.get(0).assignments().get(0).machineId()).isEqualTo(1L);
        assertThat(events.get(0).assignments().get(0).machineName()).isEqualTo("Trator JD");
    }

    @Test
    void getCalendarEvents_givenNoExecutions_shouldReturnEmpty() {
        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findByProviderAndScheduledRange(eq(1L), any(), any()))
                .thenReturn(List.of());

        List<CalendarEventResponse> events = calendarService.getCalendarEvents(
                1L, LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30));

        assertThat(events).isEmpty();
    }

    @Test
    void updateSchedule_givenNonExistentExecution_shouldThrow() {
        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findById(999L)).thenReturn(Optional.empty());

        ScheduleUpdateDto dto = new ScheduleUpdateDto(
                LocalDate.of(2026, 4, 5), LocalDate.of(2026, 4, 7));

        assertThatThrownBy(() -> calendarService.updateSchedule(999L, dto, 1L))
                .isInstanceOf(com.agroconnect.exception.ResourceNotFoundException.class);
    }

    @Test
    void detectConflicts_givenNullScheduledDates_shouldSkipExecution() {
        ServiceExecution nullDateExec = ServiceExecution.builder()
                .id(200L)
                .proposal(proposal)
                .scheduledDate(null)
                .scheduledEndDate(null)
                .assignments(Set.of())
                .build();

        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findByProviderAndScheduledRange(eq(1L), any(), any()))
                .thenReturn(List.of(nullDateExec));

        List<ConflictResponse> conflicts = calendarService.getConflicts(
                1L, LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30));

        assertThat(conflicts).isEmpty();
    }
}
