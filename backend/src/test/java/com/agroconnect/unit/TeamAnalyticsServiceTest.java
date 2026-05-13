package com.agroconnect.unit;

import com.agroconnect.dto.response.OperatorAnalyticsResponse;
import com.agroconnect.dto.response.OperatorJobResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.fixture.ExecutionFixture;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.ExecutionAssignment;
import com.agroconnect.model.Machine;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.Proposal;
import com.agroconnect.model.ServiceExecution;
import com.agroconnect.model.TeamMember;
import com.agroconnect.model.User;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.ExecutionAssignmentRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.ServiceExecutionRepository;
import com.agroconnect.repository.TeamMemberRepository;
import com.agroconnect.service.TeamAnalyticsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeamAnalyticsServiceTest {

    @Mock private TeamMemberRepository teamMemberRepository;
    @Mock private ExecutionAssignmentRepository assignmentRepository;
    @Mock private ServiceExecutionRepository executionRepository;
    @Mock private ProviderProfileRepository providerProfileRepository;
    @Mock private ClientProfileRepository clientProfileRepository;

    private TeamAnalyticsService service;

    private User providerUser;
    private ProviderProfile providerProfile;
    private TeamMember operator;
    private Machine machine;

    @BeforeEach
    void setUp() {
        service = new TeamAnalyticsService(
                teamMemberRepository, assignmentRepository,
                executionRepository, providerProfileRepository, clientProfileRepository);

        providerUser = UserFixture.aProviderUser().build();
        providerProfile = UserFixture.aProviderProfile().user(providerUser).build();
        operator = ExecutionFixture.aTeamMember().provider(providerProfile).build();
        machine = ExecutionFixture.aMachine().provider(providerProfile).build();
    }

    @Test
    void getAnalytics_givenValidProvider_shouldAggregateNumbers() {
        LocalDate from = LocalDate.of(2026, 1, 1);
        LocalDate to = LocalDate.of(2026, 5, 1);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(teamMemberRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(operator));
        when(assignmentRepository.countDistinctExecutionsForOperator(anyLong(), any(), any())).thenReturn(4L);
        when(assignmentRepository.sumHoursWorkedForOperator(anyLong(), any(), any())).thenReturn(new BigDecimal("32.00"));
        when(assignmentRepository.sumLaborCostForOperator(anyLong(), any(), any())).thenReturn(new BigDecimal("400.00"));
        when(assignmentRepository.findAllForOperatorInPeriod(anyLong(), any(), any())).thenReturn(List.of());

        OperatorAnalyticsResponse response = service.getAnalytics(1L, 2L, from, to);

        assertNotNull(response);
        assertEquals(operator.getId(), response.operatorId());
        assertEquals(operator.getName(), response.operatorName());
        assertEquals(from, response.from());
        assertEquals(to, response.to());
        assertEquals(4L, response.jobsDone());
        assertEquals(new BigDecimal("32.00"), response.hoursWorked());
        assertEquals(new BigDecimal("400.00"), response.laborCost());
        // No assignments → revenue is zero, profit is -labor
        assertEquals(0, response.revenueAttributed().compareTo(BigDecimal.ZERO));
        assertEquals(0, response.profit().compareTo(new BigDecimal("-400.00")));
        // profitPerHour = -400 / 32 = -12.50
        assertEquals(0, response.profitPerHour().compareTo(new BigDecimal("-12.50")));
        // profitPerJob = -400 / 4 = -100.00
        assertEquals(0, response.profitPerJob().compareTo(new BigDecimal("-100.00")));
        assertTrue(response.topMachines().isEmpty());
    }

    @Test
    void getAnalytics_givenNullValuesFromRepos_shouldDefaultToZero() {
        LocalDate from = LocalDate.of(2026, 1, 1);
        LocalDate to = LocalDate.of(2026, 12, 31);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(teamMemberRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(operator));
        when(assignmentRepository.countDistinctExecutionsForOperator(anyLong(), any(), any())).thenReturn(0L);
        when(assignmentRepository.sumHoursWorkedForOperator(anyLong(), any(), any())).thenReturn(null);
        when(assignmentRepository.sumLaborCostForOperator(anyLong(), any(), any())).thenReturn(null);
        when(assignmentRepository.findAllForOperatorInPeriod(anyLong(), any(), any())).thenReturn(List.of());

        OperatorAnalyticsResponse response = service.getAnalytics(1L, 2L, from, to);

        assertEquals(0, response.hoursWorked().compareTo(BigDecimal.ZERO));
        assertEquals(0, response.laborCost().compareTo(BigDecimal.ZERO));
        assertEquals(0, response.revenueAttributed().compareTo(BigDecimal.ZERO));
        assertEquals(0, response.profit().compareTo(BigDecimal.ZERO));
        assertEquals(0, response.profitPerHour().compareTo(BigDecimal.ZERO));
        assertEquals(0, response.profitPerJob().compareTo(BigDecimal.ZERO));
    }

    @Test
    void getAnalytics_givenAssignments_shouldComputeEqualSplitRevenue() {
        // Two executions:
        //  exec 100: price 500, 2 operators on it → operator's share = 250
        //  exec 200: price 300, 1 operator         → operator's share = 300
        // Total revenue = 550; labor 100 → profit 450
        LocalDate from = LocalDate.of(2026, 1, 1);
        LocalDate to = LocalDate.of(2026, 5, 1);

        Proposal p1 = Proposal.builder().id(11L).price(new BigDecimal("500.00")).build();
        Proposal p2 = Proposal.builder().id(12L).price(new BigDecimal("300.00")).build();
        ServiceExecution exec1 = ExecutionFixture.aCompletedExecution().id(100L).proposal(p1).build();
        ServiceExecution exec2 = ExecutionFixture.aCompletedExecution().id(200L).proposal(p2).build();

        ExecutionAssignment a1 = ExecutionFixture.anAssignment()
                .id(1L).execution(exec1).teamMember(operator).machine(machine)
                .hoursWorked(new BigDecimal("4.00")).machineHours(new BigDecimal("4.00")).build();
        ExecutionAssignment a2 = ExecutionFixture.anAssignment()
                .id(2L).execution(exec2).teamMember(operator).machine(machine)
                .hoursWorked(new BigDecimal("3.00")).machineHours(new BigDecimal("3.00")).build();

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(teamMemberRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(operator));
        when(assignmentRepository.countDistinctExecutionsForOperator(anyLong(), any(), any())).thenReturn(2L);
        when(assignmentRepository.sumHoursWorkedForOperator(anyLong(), any(), any())).thenReturn(new BigDecimal("7.00"));
        when(assignmentRepository.sumLaborCostForOperator(anyLong(), any(), any())).thenReturn(new BigDecimal("100.00"));
        when(assignmentRepository.findAllForOperatorInPeriod(anyLong(), any(), any())).thenReturn(List.of(a1, a2));
        when(assignmentRepository.countOperatorsForExecution(eq(100L))).thenReturn(2L);
        when(assignmentRepository.countOperatorsForExecution(eq(200L))).thenReturn(1L);

        OperatorAnalyticsResponse response = service.getAnalytics(1L, 2L, from, to);

        assertEquals(0, response.revenueAttributed().compareTo(new BigDecimal("550.00")));
        assertEquals(0, response.profit().compareTo(new BigDecimal("450.00")));
        // 450 / 7 = 64.285... → 64.29
        assertEquals(0, response.profitPerHour().compareTo(new BigDecimal("64.29")));
        // 450 / 2 = 225.00
        assertEquals(0, response.profitPerJob().compareTo(new BigDecimal("225.00")));
    }

    @Test
    void getAnalytics_givenAssignmentsOnSameExecution_shouldDeduplicateRevenue() {
        // Two assignments on the same execution (rare but possible if operator
        // appears twice for some reason) — revenue counted once.
        Proposal proposal = Proposal.builder().id(11L).price(new BigDecimal("600.00")).build();
        ServiceExecution exec = ExecutionFixture.aCompletedExecution().id(100L).proposal(proposal).build();
        ExecutionAssignment a1 = ExecutionFixture.anAssignment()
                .id(1L).execution(exec).teamMember(operator).machine(machine).build();
        ExecutionAssignment a2 = ExecutionFixture.anAssignment()
                .id(2L).execution(exec).teamMember(operator).machine(machine).build();

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(teamMemberRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(operator));
        when(assignmentRepository.countDistinctExecutionsForOperator(anyLong(), any(), any())).thenReturn(1L);
        when(assignmentRepository.sumHoursWorkedForOperator(anyLong(), any(), any())).thenReturn(BigDecimal.ZERO);
        when(assignmentRepository.sumLaborCostForOperator(anyLong(), any(), any())).thenReturn(BigDecimal.ZERO);
        when(assignmentRepository.findAllForOperatorInPeriod(anyLong(), any(), any())).thenReturn(List.of(a1, a2));
        when(assignmentRepository.countOperatorsForExecution(eq(100L))).thenReturn(2L);

        OperatorAnalyticsResponse response = service.getAnalytics(1L, 2L, null, null);

        // 600 / 2 = 300, deduplicated to a single contribution
        assertEquals(0, response.revenueAttributed().compareTo(new BigDecimal("300.00")));
    }

    @Test
    void getAnalytics_givenTopMachines_shouldRankByJobsDescAndCapToFive() {
        // Six distinct machines used; the one with most jobs comes first.
        Proposal proposal = Proposal.builder().id(11L).price(BigDecimal.ZERO).build();
        ServiceExecution exec = ExecutionFixture.aCompletedExecution().id(100L).proposal(proposal).build();

        List<ExecutionAssignment> assignments = new java.util.ArrayList<>();
        long assignmentId = 1;
        for (long mId = 1; mId <= 6; mId++) {
            Machine m = ExecutionFixture.aMachine().id(mId).name("Machine " + mId).provider(providerProfile).build();
            // Machine 1 gets 3 jobs, machine 2 gets 2 jobs, machines 3-6 get 1 job each.
            int jobs = mId == 1 ? 3 : (mId == 2 ? 2 : 1);
            for (int j = 0; j < jobs; j++) {
                ExecutionAssignment a = ExecutionFixture.anAssignment()
                        .id(assignmentId++).execution(exec).teamMember(operator).machine(m)
                        .machineHours(new BigDecimal("1.00")).build();
                assignments.add(a);
            }
        }

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(teamMemberRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(operator));
        when(assignmentRepository.countDistinctExecutionsForOperator(anyLong(), any(), any())).thenReturn(1L);
        when(assignmentRepository.sumHoursWorkedForOperator(anyLong(), any(), any())).thenReturn(BigDecimal.ZERO);
        when(assignmentRepository.sumLaborCostForOperator(anyLong(), any(), any())).thenReturn(BigDecimal.ZERO);
        when(assignmentRepository.findAllForOperatorInPeriod(anyLong(), any(), any())).thenReturn(assignments);
        when(assignmentRepository.countOperatorsForExecution(anyLong())).thenReturn(1L);

        OperatorAnalyticsResponse response = service.getAnalytics(1L, 2L, null, null);

        assertEquals(5, response.topMachines().size());
        assertEquals(1L, response.topMachines().get(0).machineId());
        assertEquals(3L, response.topMachines().get(0).jobsCount());
        assertEquals(2L, response.topMachines().get(1).machineId());
        assertEquals(2L, response.topMachines().get(1).jobsCount());
    }

    @Test
    void getAnalytics_givenSwappedDates_shouldNormalizeRange() {
        LocalDate later = LocalDate.of(2026, 5, 1);
        LocalDate earlier = LocalDate.of(2026, 1, 1);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(teamMemberRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(operator));
        when(assignmentRepository.countDistinctExecutionsForOperator(anyLong(), any(), any())).thenReturn(0L);
        when(assignmentRepository.sumHoursWorkedForOperator(anyLong(), any(), any())).thenReturn(BigDecimal.ZERO);
        when(assignmentRepository.sumLaborCostForOperator(anyLong(), any(), any())).thenReturn(BigDecimal.ZERO);
        when(assignmentRepository.findAllForOperatorInPeriod(anyLong(), any(), any())).thenReturn(List.of());

        OperatorAnalyticsResponse response = service.getAnalytics(1L, 2L, later, earlier);

        assertEquals(earlier, response.from());
        assertEquals(later, response.to());
    }

    @Test
    void getAnalytics_givenNullRange_shouldDefaultToCurrentYearToToday() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(teamMemberRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(operator));
        when(assignmentRepository.countDistinctExecutionsForOperator(anyLong(), any(), any())).thenReturn(0L);
        when(assignmentRepository.sumHoursWorkedForOperator(anyLong(), any(), any())).thenReturn(BigDecimal.ZERO);
        when(assignmentRepository.sumLaborCostForOperator(anyLong(), any(), any())).thenReturn(BigDecimal.ZERO);
        when(assignmentRepository.findAllForOperatorInPeriod(anyLong(), any(), any())).thenReturn(List.of());

        OperatorAnalyticsResponse response = service.getAnalytics(1L, 2L, null, null);

        LocalDate today = LocalDate.now();
        assertEquals(today.withDayOfYear(1), response.from());
        assertEquals(today, response.to());
    }

    @Test
    void getAnalytics_givenNotProvider_shouldThrowForbidden() {
        when(providerProfileRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThrows(ForbiddenException.class,
                () -> service.getAnalytics(1L, 99L, null, null));
    }

    @Test
    void getAnalytics_givenOperatorOfAnotherProvider_shouldThrowNotFound() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(teamMemberRepository.findByIdAndProviderId(999L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.getAnalytics(999L, 2L, null, null));
    }

    @Test
    void listJobs_givenNoExecutions_shouldReturnEmptyPage() {
        Pageable pageable = PageRequest.of(0, 20);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(teamMemberRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(operator));
        when(assignmentRepository.findExecutionIdsForOperator(anyLong(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));

        Page<OperatorJobResponse> page = service.listJobs(1L, 2L, null, null, pageable);

        assertTrue(page.getContent().isEmpty());
        assertEquals(0, page.getTotalElements());
    }

    @Test
    void listJobs_givenExecutions_shouldMapJobsWithLaborAndRevenue() {
        Pageable pageable = PageRequest.of(0, 20);

        Proposal proposal = Proposal.builder().id(50L).price(new BigDecimal("400.00")).build();
        ServiceExecution exec = ExecutionFixture.aCompletedExecution()
                .id(100L).proposal(proposal)
                .completedAt(Instant.parse("2026-04-15T10:00:00Z")).build();

        ExecutionAssignment assignment = ExecutionFixture.anAssignment()
                .id(1L).execution(exec).teamMember(operator).machine(machine)
                .hoursWorked(new BigDecimal("4.00"))
                .hourlyRateSnapshot(new BigDecimal("12.50"))
                .machineHours(new BigDecimal("4.00")).build();
        Set<ExecutionAssignment> assignments = new HashSet<>();
        assignments.add(assignment);
        exec.setAssignments(assignments);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(teamMemberRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(operator));
        when(assignmentRepository.findExecutionIdsForOperator(anyLong(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(100L), pageable, 1));
        when(executionRepository.findAllById(List.of(100L))).thenReturn(List.of(exec));
        when(assignmentRepository.countOperatorsForExecution(100L)).thenReturn(2L);

        Page<OperatorJobResponse> page = service.listJobs(1L, 2L,
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31), pageable);

        assertEquals(1, page.getContent().size());
        OperatorJobResponse job = page.getContent().get(0);
        assertEquals(100L, job.executionId());
        assertEquals(0, job.hoursWorked().compareTo(new BigDecimal("4.00")));
        assertEquals(0, job.hourlyRateSnapshot().compareTo(new BigDecimal("12.50")));
        // labor = 4 × 12.50 = 50.00
        assertEquals(0, job.laborCost().compareTo(new BigDecimal("50.00")));
        // revenue share = 400 / 2 = 200.00
        assertEquals(0, job.revenueAttributed().compareTo(new BigDecimal("200.00")));
        assertEquals("Trator John Deere 6120M", job.machineName());
    }

    @Test
    void listJobs_givenNotProvider_shouldThrowForbidden() {
        Pageable pageable = PageRequest.of(0, 20);
        when(providerProfileRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThrows(ForbiddenException.class,
                () -> service.listJobs(1L, 99L, null, null, pageable));
    }
}
