package com.agroconnect.unit;

import com.agroconnect.dto.response.MachineAnalyticsResponse;
import com.agroconnect.dto.response.MachineJobResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.fixture.ExecutionFixture;
import com.agroconnect.fixture.ServiceRequestFixture;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.ExecutionAssignment;
import com.agroconnect.model.Machine;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.Proposal;
import com.agroconnect.model.ServiceExecution;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.User;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.ExecutionAssignmentRepository;
import com.agroconnect.repository.MachineExpenseRepository;
import com.agroconnect.repository.MachineMaintenanceLogRepository;
import com.agroconnect.repository.MachineRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.ServiceExecutionRepository;
import com.agroconnect.service.MachineAnalyticsService;
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
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MachineAnalyticsServiceTest {

    @Mock private MachineRepository machineRepository;
    @Mock private MachineMaintenanceLogRepository maintenanceRepository;
    @Mock private MachineExpenseRepository expenseRepository;
    @Mock private ExecutionAssignmentRepository assignmentRepository;
    @Mock private ServiceExecutionRepository executionRepository;
    @Mock private ProviderProfileRepository providerProfileRepository;
    @Mock private ClientProfileRepository clientProfileRepository;

    private MachineAnalyticsService service;

    private User providerUser;
    private ProviderProfile providerProfile;
    private Machine machine;

    @BeforeEach
    void setUp() {
        service = new MachineAnalyticsService(
                machineRepository, maintenanceRepository, expenseRepository,
                assignmentRepository, executionRepository,
                providerProfileRepository, clientProfileRepository);

        providerUser = UserFixture.aProviderUser().build();
        providerProfile = UserFixture.aProviderProfile().user(providerUser).build();
        machine = ExecutionFixture.aMachine().provider(providerProfile).build();
        machine.setLastMaintenanceDate(LocalDate.of(2026, 4, 1));
        machine.setNextMaintenanceDate(LocalDate.of(2026, 10, 1));
    }

    @Test
    void getAnalytics_givenValidProvider_shouldAggregateNumbers() {
        LocalDate from = LocalDate.of(2026, 1, 1);
        LocalDate to = LocalDate.of(2026, 5, 1);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(assignmentRepository.countDistinctExecutionsForMachine(anyLong(), any(), any())).thenReturn(5L);
        when(assignmentRepository.sumMachineHoursInPeriod(anyLong(), any(), any())).thenReturn(new BigDecimal("40.50"));
        when(assignmentRepository.sumRevenueAttributedToMachine(anyLong(), any(), any())).thenReturn(new BigDecimal("2500.00"));
        when(maintenanceRepository.sumCostInPeriod(anyLong(), any(), any())).thenReturn(new BigDecimal("300.00"));
        when(expenseRepository.sumAmountInPeriod(anyLong(), any(), any())).thenReturn(new BigDecimal("150.50"));
        when(maintenanceRepository.countInPeriod(anyLong(), any(), any())).thenReturn(3L);

        MachineAnalyticsResponse response = service.getAnalytics(1L, 2L, from, to);

        assertNotNull(response);
        assertEquals(1L, response.machineId());
        assertEquals(from, response.from());
        assertEquals(to, response.to());
        assertEquals(5L, response.jobsDone());
        assertEquals(new BigDecimal("40.50"), response.machineHours());
        assertEquals(new BigDecimal("2500.00"), response.revenue());
        assertEquals(new BigDecimal("300.00"), response.maintenanceCost());
        assertEquals(new BigDecimal("150.50"), response.expensesCost());
        // 2500 - 300 - 150.50 = 2049.50
        assertEquals(new BigDecimal("2049.50"), response.netContribution());
        assertEquals(3L, response.maintenanceCount());
        assertEquals(LocalDate.of(2026, 4, 1), response.lastMaintenanceAt());
        assertEquals(LocalDate.of(2026, 10, 1), response.nextMaintenanceAt());
    }

    @Test
    void getAnalytics_givenNullValuesFromRepos_shouldDefaultToZero() {
        LocalDate from = LocalDate.of(2026, 1, 1);
        LocalDate to = LocalDate.of(2026, 12, 31);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(assignmentRepository.countDistinctExecutionsForMachine(anyLong(), any(), any())).thenReturn(0L);
        when(assignmentRepository.sumMachineHoursInPeriod(anyLong(), any(), any())).thenReturn(null);
        when(assignmentRepository.sumRevenueAttributedToMachine(anyLong(), any(), any())).thenReturn(null);
        when(maintenanceRepository.sumCostInPeriod(anyLong(), any(), any())).thenReturn(null);
        when(expenseRepository.sumAmountInPeriod(anyLong(), any(), any())).thenReturn(null);
        when(maintenanceRepository.countInPeriod(anyLong(), any(), any())).thenReturn(0L);

        MachineAnalyticsResponse response = service.getAnalytics(1L, 2L, from, to);

        assertEquals(0, response.machineHours().compareTo(new BigDecimal("0.00")));
        assertEquals(0, response.revenue().compareTo(BigDecimal.ZERO));
        assertEquals(0, response.maintenanceCost().compareTo(BigDecimal.ZERO));
        assertEquals(0, response.expensesCost().compareTo(BigDecimal.ZERO));
        assertEquals(0, response.netContribution().compareTo(BigDecimal.ZERO));
        assertEquals(0, response.utilizationPercent().compareTo(BigDecimal.ZERO));
    }

    @Test
    void getAnalytics_givenSwappedDates_shouldNormalizeRange() {
        // from after to → service swaps them
        LocalDate later = LocalDate.of(2026, 5, 1);
        LocalDate earlier = LocalDate.of(2026, 1, 1);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(assignmentRepository.countDistinctExecutionsForMachine(anyLong(), any(), any())).thenReturn(0L);
        when(assignmentRepository.sumMachineHoursInPeriod(anyLong(), any(), any())).thenReturn(BigDecimal.ZERO);
        when(assignmentRepository.sumRevenueAttributedToMachine(anyLong(), any(), any())).thenReturn(BigDecimal.ZERO);
        when(maintenanceRepository.sumCostInPeriod(anyLong(), any(), any())).thenReturn(BigDecimal.ZERO);
        when(expenseRepository.sumAmountInPeriod(anyLong(), any(), any())).thenReturn(BigDecimal.ZERO);
        when(maintenanceRepository.countInPeriod(anyLong(), any(), any())).thenReturn(0L);

        MachineAnalyticsResponse response = service.getAnalytics(1L, 2L, later, earlier);

        assertEquals(earlier, response.from());
        assertEquals(later, response.to());
    }

    @Test
    void getAnalytics_givenNullRange_shouldDefaultToCurrentYearToToday() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(assignmentRepository.countDistinctExecutionsForMachine(anyLong(), any(), any())).thenReturn(0L);
        when(assignmentRepository.sumMachineHoursInPeriod(anyLong(), any(), any())).thenReturn(BigDecimal.ZERO);
        when(assignmentRepository.sumRevenueAttributedToMachine(anyLong(), any(), any())).thenReturn(BigDecimal.ZERO);
        when(maintenanceRepository.sumCostInPeriod(anyLong(), any(), any())).thenReturn(BigDecimal.ZERO);
        when(expenseRepository.sumAmountInPeriod(anyLong(), any(), any())).thenReturn(BigDecimal.ZERO);
        when(maintenanceRepository.countInPeriod(anyLong(), any(), any())).thenReturn(0L);

        MachineAnalyticsResponse response = service.getAnalytics(1L, 2L, null, null);

        LocalDate today = LocalDate.now();
        assertEquals(today.withDayOfYear(1), response.from());
        assertEquals(today, response.to());
    }

    @Test
    void getAnalytics_utilization_shouldDivideHoursByEightTimesDays() {
        // 10 days × 8h = 80 working hours. 40 hours = 50.0%.
        LocalDate from = LocalDate.of(2026, 5, 1);
        LocalDate to = LocalDate.of(2026, 5, 10);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(assignmentRepository.countDistinctExecutionsForMachine(anyLong(), any(), any())).thenReturn(1L);
        when(assignmentRepository.sumMachineHoursInPeriod(anyLong(), any(), any())).thenReturn(new BigDecimal("40.00"));
        when(assignmentRepository.sumRevenueAttributedToMachine(anyLong(), any(), any())).thenReturn(BigDecimal.ZERO);
        when(maintenanceRepository.sumCostInPeriod(anyLong(), any(), any())).thenReturn(BigDecimal.ZERO);
        when(expenseRepository.sumAmountInPeriod(anyLong(), any(), any())).thenReturn(BigDecimal.ZERO);
        when(maintenanceRepository.countInPeriod(anyLong(), any(), any())).thenReturn(0L);

        MachineAnalyticsResponse response = service.getAnalytics(1L, 2L, from, to);

        // utilization = 40 / (10 * 8) * 100 = 50.0
        assertEquals(0, response.utilizationPercent().compareTo(new BigDecimal("50.0")));
    }

    @Test
    void getAnalytics_givenNotProvider_shouldThrowForbidden() {
        when(providerProfileRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThrows(ForbiddenException.class,
                () -> service.getAnalytics(1L, 99L, null, null));
    }

    @Test
    void getAnalytics_givenMachineOfAnotherProvider_shouldThrowNotFound() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(999L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.getAnalytics(999L, 2L, null, null));
    }

    @Test
    void listJobs_givenNoExecutions_shouldReturnEmptyPage() {
        Pageable pageable = PageRequest.of(0, 20);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(assignmentRepository.findExecutionIdsForMachine(anyLong(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));

        Page<MachineJobResponse> page = service.listJobs(1L, 2L, null, null, pageable);

        assertTrue(page.getContent().isEmpty());
        assertEquals(0, page.getTotalElements());
    }

    @Test
    void listJobs_givenExecutions_shouldReturnJobResponses() {
        Pageable pageable = PageRequest.of(0, 20);

        Proposal proposal = Proposal.builder()
                .id(50L)
                .price(new BigDecimal("500.00"))
                .build();

        ServiceExecution exec = ExecutionFixture.aCompletedExecution()
                .id(100L)
                .proposal(proposal)
                .completedAt(Instant.parse("2026-04-15T10:00:00Z"))
                .build();

        ExecutionAssignment assignment = ExecutionFixture.anAssignment()
                .id(1L)
                .execution(exec)
                .machine(machine)
                .machineHours(new BigDecimal("4.50"))
                .build();
        Set<ExecutionAssignment> assignments = new HashSet<>();
        assignments.add(assignment);
        exec.setAssignments(assignments);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(assignmentRepository.findExecutionIdsForMachine(anyLong(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(100L), pageable, 1));
        when(executionRepository.findAllById(List.of(100L))).thenReturn(List.of(exec));

        Page<MachineJobResponse> page = service.listJobs(1L, 2L,
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31), pageable);

        assertEquals(1, page.getContent().size());
        MachineJobResponse job = page.getContent().get(0);
        assertEquals(100L, job.executionId());
        assertEquals(new BigDecimal("500.00"), job.revenue());
        assertEquals(new BigDecimal("4.50"), job.machineHours());
    }

    @Test
    void listJobs_givenNotProvider_shouldThrowForbidden() {
        Pageable pageable = PageRequest.of(0, 20);
        when(providerProfileRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThrows(ForbiddenException.class,
                () -> service.listJobs(1L, 99L, null, null, pageable));
    }

    @Test
    void listJobs_givenProposalWithRequestAndClient_shouldPopulateRequestIdAndClientName() {
        Pageable pageable = PageRequest.of(0, 20);

        User clientUser = UserFixture.aClientUser().id(77L).build();
        ServiceRequest request = ServiceRequestFixture.aRequest()
                .id(555L)
                .client(clientUser)
                .build();
        Proposal proposal = Proposal.builder()
                .id(50L)
                .price(new BigDecimal("999.00"))
                .request(request)
                .build();

        ServiceExecution exec = ExecutionFixture.aCompletedExecution()
                .id(101L)
                .proposal(proposal)
                .build();

        ExecutionAssignment assignment = ExecutionFixture.anAssignment()
                .id(2L)
                .execution(exec)
                .machine(machine)
                .machineHours(new BigDecimal("3.00"))
                .build();
        Set<ExecutionAssignment> assignments = new HashSet<>();
        assignments.add(assignment);
        exec.setAssignments(assignments);

        ClientProfile clientProfile = UserFixture.aClientProfile()
                .name("Cliente Teste")
                .user(clientUser)
                .build();

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(assignmentRepository.findExecutionIdsForMachine(anyLong(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(101L), pageable, 1));
        when(executionRepository.findAllById(List.of(101L))).thenReturn(List.of(exec));
        when(clientProfileRepository.findByUserId(77L)).thenReturn(Optional.of(clientProfile));

        Page<MachineJobResponse> page = service.listJobs(1L, 2L, null, null, pageable);

        assertEquals(1, page.getContent().size());
        MachineJobResponse job = page.getContent().get(0);
        assertEquals(555L, job.requestId());
        assertEquals("Cliente Teste", job.clientName());
    }

    @Test
    void listJobs_givenExecutionWithoutMatchingId_shouldSkipNullEntry() {
        Pageable pageable = PageRequest.of(0, 20);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        // Page returns id 200, but executionRepository only knows about id 999 — findExecution returns null
        when(assignmentRepository.findExecutionIdsForMachine(anyLong(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(200L), pageable, 1));
        ServiceExecution otherExec = ExecutionFixture.aCompletedExecution().id(999L).build();
        when(executionRepository.findAllById(List.of(200L))).thenReturn(List.of(otherExec));

        Page<MachineJobResponse> page = service.listJobs(1L, 2L, null, null, pageable);

        assertTrue(page.getContent().isEmpty());
    }

    @Test
    void listJobs_givenAssignmentsWithoutMachine_shouldNotCountHours() {
        Pageable pageable = PageRequest.of(0, 20);

        Proposal proposal = Proposal.builder().id(60L).price(new BigDecimal("100.00")).build();
        ServiceExecution exec = ExecutionFixture.aCompletedExecution()
                .id(102L).proposal(proposal).build();

        // Assignment with no machine → filtered out (line 144 false branch)
        ExecutionAssignment noMachineAssignment = ExecutionFixture.anAssignment()
                .id(3L).execution(exec).machine(null).machineHours(new BigDecimal("8.00")).build();
        Set<ExecutionAssignment> assignments = new HashSet<>();
        assignments.add(noMachineAssignment);
        exec.setAssignments(assignments);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(assignmentRepository.findExecutionIdsForMachine(anyLong(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(102L), pageable, 1));
        when(executionRepository.findAllById(List.of(102L))).thenReturn(List.of(exec));

        Page<MachineJobResponse> page = service.listJobs(1L, 2L, null, null, pageable);

        assertEquals(0, page.getContent().get(0).machineHours().compareTo(BigDecimal.ZERO));
    }

    @Test
    void listJobs_givenProposalWithoutPrice_shouldReturnZeroRevenue() {
        Pageable pageable = PageRequest.of(0, 20);

        Proposal proposal = Proposal.builder().id(70L).price(null).build();
        ServiceExecution exec = ExecutionFixture.aCompletedExecution().id(103L).proposal(proposal).build();
        exec.setAssignments(new HashSet<>());

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(assignmentRepository.findExecutionIdsForMachine(anyLong(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(103L), pageable, 1));
        when(executionRepository.findAllById(List.of(103L))).thenReturn(List.of(exec));

        Page<MachineJobResponse> page = service.listJobs(1L, 2L, null, null, pageable);

        assertEquals(0, page.getContent().get(0).revenue().compareTo(BigDecimal.ZERO));
    }

    @Test
    void listJobs_givenRequestWithoutClientProfile_shouldReturnNullClientName() {
        Pageable pageable = PageRequest.of(0, 20);

        User clientUser = UserFixture.aClientUser().id(88L).build();
        ServiceRequest request = ServiceRequestFixture.aRequest().id(556L).client(clientUser).build();
        Proposal proposal = Proposal.builder().id(80L).price(new BigDecimal("50.00")).request(request).build();
        ServiceExecution exec = ExecutionFixture.aCompletedExecution().id(104L).proposal(proposal).build();
        exec.setAssignments(new HashSet<>());

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(assignmentRepository.findExecutionIdsForMachine(anyLong(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(104L), pageable, 1));
        when(executionRepository.findAllById(List.of(104L))).thenReturn(List.of(exec));
        when(clientProfileRepository.findByUserId(88L)).thenReturn(Optional.empty());

        Page<MachineJobResponse> page = service.listJobs(1L, 2L, null, null, pageable);

        MachineJobResponse job = page.getContent().get(0);
        assertEquals(556L, job.requestId());
        assertNull(job.clientName());
    }
}
