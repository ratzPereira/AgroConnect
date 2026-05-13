package com.agroconnect.unit;

import com.agroconnect.dto.request.ReassignExecutionDto;
import com.agroconnect.dto.request.ScheduleUpdateDto;
import com.agroconnect.dto.response.CalendarAlertsResponse;
import com.agroconnect.dto.response.CalendarEventResponse;
import com.agroconnect.dto.response.CalendarSummaryResponse;
import com.agroconnect.dto.response.ConflictResponse;
import com.agroconnect.dto.response.MaintenanceWindowResponse;
import com.agroconnect.dto.response.WorkloadHeatmapResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.exception.ValidationException;
import com.agroconnect.model.ExecutionAssignment;
import com.agroconnect.model.Machine;
import com.agroconnect.model.MachineMaintenanceLog;
import com.agroconnect.model.Proposal;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.ServiceExecution;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.TeamMember;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.model.enums.TeamMemberRole;
import com.agroconnect.model.enums.Urgency;
import com.agroconnect.repository.ExecutionAssignmentRepository;
import com.agroconnect.repository.MachineMaintenanceLogRepository;
import com.agroconnect.repository.MachineRepository;
import com.agroconnect.repository.ProposalRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.ServiceExecutionRepository;
import com.agroconnect.repository.TeamMemberRepository;
import com.agroconnect.service.CalendarService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
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

    @Mock
    private ExecutionAssignmentRepository executionAssignmentRepository;

    @Mock
    private TeamMemberRepository teamMemberRepository;

    @Mock
    private MachineRepository machineRepository;

    @Mock
    private MachineMaintenanceLogRepository maintenanceLogRepository;

    @Mock
    private ProposalRepository proposalRepository;

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
                LocalDate.of(2026, 4, 5), LocalDate.of(2026, 4, 7), null, null, null);

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
                LocalDate.of(2026, 4, 10), LocalDate.of(2026, 4, 5), null, null, null);

        assertThatThrownBy(() -> calendarService.updateSchedule(100L, dto, 1L))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void updateSchedule_givenWrongProvider_shouldThrow() {
        ProviderProfile otherProvider = ProviderProfile.builder().id(99L).build();
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(otherProvider));
        when(executionRepository.findById(100L)).thenReturn(Optional.of(execution));

        ScheduleUpdateDto dto = new ScheduleUpdateDto(
                LocalDate.of(2026, 4, 5), LocalDate.of(2026, 4, 7), null, null, null);

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
                LocalDate.of(2026, 4, 5), LocalDate.of(2026, 4, 7), null, null, null);

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

    // ───────── Time-window scheduling and validation ─────────

    @Test
    void updateSchedule_givenAllDayTrueWithTimes_shouldThrow() {
        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findById(100L)).thenReturn(Optional.of(execution));

        ScheduleUpdateDto dto = new ScheduleUpdateDto(
                LocalDate.of(2026, 4, 5), LocalDate.of(2026, 4, 5),
                LocalTime.of(9, 0), LocalTime.of(11, 0), true);

        assertThatThrownBy(() -> calendarService.updateSchedule(100L, dto, 1L))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("dia inteiro");
    }

    @Test
    void updateSchedule_givenAllDayFalseWithoutStartTime_shouldThrow() {
        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findById(100L)).thenReturn(Optional.of(execution));

        ScheduleUpdateDto dto = new ScheduleUpdateDto(
                LocalDate.of(2026, 4, 5), LocalDate.of(2026, 4, 5),
                null, LocalTime.of(11, 0), false);

        assertThatThrownBy(() -> calendarService.updateSchedule(100L, dto, 1L))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void updateSchedule_givenEndTimeEqualToStartTime_shouldThrow() {
        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findById(100L)).thenReturn(Optional.of(execution));

        ScheduleUpdateDto dto = new ScheduleUpdateDto(
                LocalDate.of(2026, 4, 5), LocalDate.of(2026, 4, 5),
                LocalTime.of(9, 0), LocalTime.of(9, 0), false);

        assertThatThrownBy(() -> calendarService.updateSchedule(100L, dto, 1L))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("posterior");
    }

    @Test
    void updateSchedule_givenValidTimeWindow_shouldPersistTimes() {
        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findById(100L)).thenReturn(Optional.of(execution));
        when(executionRepository.save(any())).thenReturn(execution);

        ScheduleUpdateDto dto = new ScheduleUpdateDto(
                LocalDate.of(2026, 4, 5), LocalDate.of(2026, 4, 5),
                LocalTime.of(9, 0), LocalTime.of(12, 30), false);

        calendarService.updateSchedule(100L, dto, 1L);

        assertThat(execution.isScheduledAllDay()).isFalse();
        assertThat(execution.getScheduledStartTime()).isEqualTo(LocalTime.of(9, 0));
        assertThat(execution.getScheduledEndTime()).isEqualTo(LocalTime.of(12, 30));
    }

    @Test
    void updateSchedule_givenAllDayDefault_shouldNullTimes() {
        execution.setScheduledStartTime(LocalTime.of(9, 0));
        execution.setScheduledEndTime(LocalTime.of(12, 0));
        execution.setScheduledAllDay(false);

        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findById(100L)).thenReturn(Optional.of(execution));
        when(executionRepository.save(any())).thenReturn(execution);

        ScheduleUpdateDto dto = new ScheduleUpdateDto(
                LocalDate.of(2026, 4, 5), LocalDate.of(2026, 4, 7), null, null, null);

        calendarService.updateSchedule(100L, dto, 1L);

        assertThat(execution.isScheduledAllDay()).isTrue();
        assertThat(execution.getScheduledStartTime()).isNull();
        assertThat(execution.getScheduledEndTime()).isNull();
    }

    // ───────── Timed-overlap conflict detection ─────────

    @Test
    void getConflicts_givenSameDayDifferentTimes_shouldNotFlagAsConflict() {
        // Same operator, same day, but back-to-back time windows that do NOT overlap
        ServiceExecution morning = ServiceExecution.builder()
                .id(100L).proposal(proposal)
                .scheduledDate(LocalDate.of(2026, 4, 1)).scheduledEndDate(LocalDate.of(2026, 4, 1))
                .scheduledAllDay(false)
                .scheduledStartTime(LocalTime.of(8, 0)).scheduledEndTime(LocalTime.of(10, 0))
                .assignments(Set.of(ExecutionAssignment.builder().id(1L).teamMember(teamMember).build()))
                .build();

        ServiceExecution afternoon = ServiceExecution.builder()
                .id(101L).proposal(otherProposalForRequest(11L, "Poda"))
                .scheduledDate(LocalDate.of(2026, 4, 1)).scheduledEndDate(LocalDate.of(2026, 4, 1))
                .scheduledAllDay(false)
                .scheduledStartTime(LocalTime.of(14, 0)).scheduledEndTime(LocalTime.of(16, 0))
                .assignments(Set.of(ExecutionAssignment.builder().id(2L).teamMember(teamMember).build()))
                .build();

        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findByProviderAndScheduledRange(eq(1L), any(), any()))
                .thenReturn(List.of(morning, afternoon));

        List<ConflictResponse> conflicts = calendarService.getConflicts(
                1L, LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30));

        assertThat(conflicts).isEmpty();
    }

    @Test
    void getConflicts_givenOverlappingTimeWindows_shouldDetect() {
        ServiceExecution morning = ServiceExecution.builder()
                .id(100L).proposal(proposal)
                .scheduledDate(LocalDate.of(2026, 4, 1)).scheduledEndDate(LocalDate.of(2026, 4, 1))
                .scheduledAllDay(false)
                .scheduledStartTime(LocalTime.of(8, 0)).scheduledEndTime(LocalTime.of(12, 0))
                .assignments(Set.of(ExecutionAssignment.builder().id(1L).teamMember(teamMember).build()))
                .build();

        ServiceExecution overlap = ServiceExecution.builder()
                .id(101L).proposal(otherProposalForRequest(11L, "Poda"))
                .scheduledDate(LocalDate.of(2026, 4, 1)).scheduledEndDate(LocalDate.of(2026, 4, 1))
                .scheduledAllDay(false)
                .scheduledStartTime(LocalTime.of(11, 0)).scheduledEndTime(LocalTime.of(13, 0))
                .assignments(Set.of(ExecutionAssignment.builder().id(2L).teamMember(teamMember).build()))
                .build();

        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findByProviderAndScheduledRange(eq(1L), any(), any()))
                .thenReturn(List.of(morning, overlap));

        List<ConflictResponse> conflicts = calendarService.getConflicts(
                1L, LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30));

        assertThat(conflicts).isNotEmpty();
        assertThat(conflicts.get(0).resourceType()).isEqualTo("TEAM_MEMBER");
    }

    @Test
    void getConflicts_givenAllDayMixedWithTimed_shouldDetect() {
        ServiceExecution allDay = ServiceExecution.builder()
                .id(100L).proposal(proposal)
                .scheduledDate(LocalDate.of(2026, 4, 1)).scheduledEndDate(LocalDate.of(2026, 4, 1))
                .scheduledAllDay(true)
                .assignments(Set.of(ExecutionAssignment.builder().id(1L).teamMember(teamMember).build()))
                .build();

        ServiceExecution timed = ServiceExecution.builder()
                .id(101L).proposal(otherProposalForRequest(11L, "Poda"))
                .scheduledDate(LocalDate.of(2026, 4, 1)).scheduledEndDate(LocalDate.of(2026, 4, 1))
                .scheduledAllDay(false)
                .scheduledStartTime(LocalTime.of(14, 0)).scheduledEndTime(LocalTime.of(16, 0))
                .assignments(Set.of(ExecutionAssignment.builder().id(2L).teamMember(teamMember).build()))
                .build();

        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findByProviderAndScheduledRange(eq(1L), any(), any()))
                .thenReturn(List.of(allDay, timed));

        List<ConflictResponse> conflicts = calendarService.getConflicts(
                1L, LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30));

        assertThat(conflicts).isNotEmpty();
    }

    // ───────── Summary / workload / alerts / maintenance ─────────

    @Test
    void getCalendarSummary_shouldAggregateRevenueAndCounts() {
        proposal.setPrice(new BigDecimal("500.00"));
        execution.getProposal().getRequest().setStatus(RequestStatus.IN_PROGRESS);

        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findByProviderAndScheduledRange(eq(1L), any(), any()))
                .thenReturn(List.of(execution));
        when(teamMemberRepository.findByProviderIdAndActiveTrue(1L))
                .thenReturn(List.of(teamMember));

        CalendarSummaryResponse summary = calendarService.getCalendarSummary(
                1L, LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30));

        assertThat(summary.totalEvents()).isEqualTo(1);
        assertThat(summary.inProgress()).isEqualTo(1);
        assertThat(summary.totalRevenue()).isEqualByComparingTo("500.00");
        assertThat(summary.activeOperators()).isEqualTo(1);
    }

    @Test
    void getWorkloadHeatmap_shouldReturnRowsPerActiveOperator() {
        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(teamMemberRepository.findByProviderIdAndActiveTrue(1L))
                .thenReturn(List.of(teamMember));
        when(executionRepository.findByProviderAndScheduledRange(eq(1L), any(), any()))
                .thenReturn(List.of(execution));

        WorkloadHeatmapResponse workload = calendarService.getWorkloadHeatmap(
                1L, LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 3));

        assertThat(workload.operators()).hasSize(1);
        assertThat(workload.operators().get(0).teamMemberId()).isEqualTo(1L);
        assertThat(workload.operators().get(0).totalMinutes()).isGreaterThan(0);
        assertThat(workload.operators().get(0).minutesByDate())
                .containsKey(LocalDate.of(2026, 4, 1));
    }

    @Test
    void getMaintenanceWindows_shouldMapDtos() {
        Machine machine = Machine.builder().id(1L).name("Trator JD").build();
        MachineMaintenanceLog log = MachineMaintenanceLog.builder()
                .id(7L).machine(machine)
                .performedAt(LocalDate.of(2026, 3, 1))
                .nextDueAt(LocalDate.of(2026, 4, 15))
                .description("Mudança óleo")
                .build();

        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(maintenanceLogRepository.findUpcomingByProviderInRange(eq(1L), any(), any()))
                .thenReturn(List.of(log));

        List<MaintenanceWindowResponse> windows = calendarService.getMaintenanceWindows(
                1L, LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30));

        assertThat(windows).hasSize(1);
        assertThat(windows.get(0).machineName()).isEqualTo("Trator JD");
        assertThat(windows.get(0).nextDueAt()).isEqualTo(LocalDate.of(2026, 4, 15));
    }

    @Test
    void getAlerts_shouldAggregateAcrossSources() {
        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findByProviderAndScheduledRange(eq(1L), any(), any()))
                .thenReturn(List.of());
        when(maintenanceLogRepository.findUpcomingByProviderInRange(eq(1L), any(), any()))
                .thenReturn(List.of());
        when(executionRepository.findCompletedAwaitingConfirmationBefore(any()))
                .thenReturn(List.of());
        when(proposalRepository.findPendingByProviderId(1L)).thenReturn(List.of());

        CalendarAlertsResponse alerts = calendarService.getAlerts(
                1L, LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30));

        assertThat(alerts.conflicts()).isEmpty();
        assertThat(alerts.maintenance()).isEmpty();
        assertThat(alerts.payments()).isEmpty();
        assertThat(alerts.proposals()).isEmpty();
    }

    @Test
    void getAlerts_givenLatePayment_shouldSurfacePaymentAlert() {
        Instant completedAt = Instant.now().minus(7, ChronoUnit.DAYS);
        ServiceExecution awaiting = ServiceExecution.builder()
                .id(500L).proposal(proposal)
                .completedAt(completedAt)
                .scheduledDate(LocalDate.now().minusDays(7))
                .scheduledEndDate(LocalDate.now().minusDays(7))
                .assignments(Set.of())
                .build();

        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findByProviderAndScheduledRange(eq(1L), any(), any()))
                .thenReturn(List.of());
        when(maintenanceLogRepository.findUpcomingByProviderInRange(eq(1L), any(), any()))
                .thenReturn(List.of());
        when(executionRepository.findCompletedAwaitingConfirmationBefore(any()))
                .thenReturn(List.of(awaiting));
        when(proposalRepository.findPendingByProviderId(1L)).thenReturn(List.of());

        CalendarAlertsResponse alerts = calendarService.getAlerts(
                1L, LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30));

        assertThat(alerts.payments()).hasSize(1);
        assertThat(alerts.payments().get(0).daysAwaiting()).isGreaterThanOrEqualTo(6);
    }

    // ───────── Reassign execution ─────────

    @Test
    void reassignExecution_shouldSwapOperator() {
        TeamMember newMember = TeamMember.builder()
                .id(2L).name("Maria Costa").role(TeamMemberRole.OPERATOR).provider(provider).build();

        ExecutionAssignment current = ExecutionAssignment.builder()
                .id(50L).teamMember(teamMember).build();
        Set<ExecutionAssignment> mutable = new HashSet<>();
        mutable.add(current);
        execution.setAssignments(mutable);

        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findById(100L)).thenReturn(Optional.of(execution));
        when(teamMemberRepository.findByIdAndProviderId(2L, 1L)).thenReturn(Optional.of(newMember));
        when(executionAssignmentRepository.existsByExecutionIdAndTeamMemberId(100L, 2L))
                .thenReturn(false);

        ReassignExecutionDto dto = new ReassignExecutionDto(1L, 2L, null);
        calendarService.reassignExecution(100L, dto, 1L);

        assertThat(current.getTeamMember().getId()).isEqualTo(2L);
        verify(executionAssignmentRepository).save(current);
    }

    @Test
    void reassignExecution_givenTargetAlreadyAssigned_shouldThrow() {
        TeamMember newMember = TeamMember.builder()
                .id(2L).name("Maria Costa").role(TeamMemberRole.OPERATOR).provider(provider).build();

        ExecutionAssignment current = ExecutionAssignment.builder()
                .id(50L).teamMember(teamMember).build();
        Set<ExecutionAssignment> mutable = new HashSet<>();
        mutable.add(current);
        execution.setAssignments(mutable);

        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findById(100L)).thenReturn(Optional.of(execution));
        when(teamMemberRepository.findByIdAndProviderId(2L, 1L)).thenReturn(Optional.of(newMember));
        when(executionAssignmentRepository.existsByExecutionIdAndTeamMemberId(100L, 2L))
                .thenReturn(true);

        ReassignExecutionDto dto = new ReassignExecutionDto(1L, 2L, null);

        assertThatThrownBy(() -> calendarService.reassignExecution(100L, dto, 1L))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void reassignExecution_givenFromOperatorNotAssigned_shouldThrow() {
        TeamMember newMember = TeamMember.builder()
                .id(2L).name("Maria Costa").role(TeamMemberRole.OPERATOR).provider(provider).build();

        when(providerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(provider));
        when(executionRepository.findById(100L)).thenReturn(Optional.of(execution));
        when(teamMemberRepository.findByIdAndProviderId(2L, 1L)).thenReturn(Optional.of(newMember));

        ReassignExecutionDto dto = new ReassignExecutionDto(99L, 2L, null);

        assertThatThrownBy(() -> calendarService.reassignExecution(100L, dto, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void reassignExecution_givenWrongProvider_shouldThrow() {
        ProviderProfile other = ProviderProfile.builder().id(99L).build();
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(other));
        when(executionRepository.findById(100L)).thenReturn(Optional.of(execution));

        ReassignExecutionDto dto = new ReassignExecutionDto(1L, 2L, null);

        assertThatThrownBy(() -> calendarService.reassignExecution(100L, dto, 2L))
                .isInstanceOf(ForbiddenException.class);
    }

    private Proposal otherProposalForRequest(Long requestId, String catName) {
        return Proposal.builder()
                .id(requestId + 100)
                .provider(provider)
                .request(ServiceRequest.builder()
                        .id(requestId)
                        .title("Outro serviço")
                        .category(com.agroconnect.model.ServiceCategory.builder()
                                .id(2L).name(catName).build())
                        .status(RequestStatus.AWARDED)
                        .island("São Miguel")
                        .parish("R. Grande")
                        .urgency(Urgency.LOW)
                        .build())
                .build();
    }
}
