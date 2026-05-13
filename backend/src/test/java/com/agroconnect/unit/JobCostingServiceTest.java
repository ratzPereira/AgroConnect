package com.agroconnect.unit;

import com.agroconnect.dto.request.RecordAdjustmentInDto;
import com.agroconnect.dto.request.RecordResourceUsageDto;
import com.agroconnect.dto.request.UpdateAssignmentHoursDto;
import com.agroconnect.dto.response.AssignmentCostResponse;
import com.agroconnect.dto.response.ExecutionResourceUsageResponse;
import com.agroconnect.dto.response.JobCostsResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.fixture.ExecutionFixture;
import com.agroconnect.fixture.InventoryFixture;
import com.agroconnect.fixture.ProposalFixture;
import com.agroconnect.fixture.ServiceRequestFixture;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.ExecutionAssignment;
import com.agroconnect.model.ExecutionResourceUsage;
import com.agroconnect.model.InventoryItem;
import com.agroconnect.model.InventoryMovement;
import com.agroconnect.model.Proposal;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.ServiceExecution;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.TeamMember;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.ProposalStatus;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.ExecutionAssignmentRepository;
import com.agroconnect.repository.ExecutionResourceUsageRepository;
import com.agroconnect.repository.InventoryItemRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.ServiceExecutionRepository;
import com.agroconnect.repository.UserRepository;
import com.agroconnect.service.InventoryMovementService;
import com.agroconnect.service.JobCostingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobCostingServiceTest {

    @Mock private ServiceExecutionRepository executionRepository;
    @Mock private ExecutionAssignmentRepository assignmentRepository;
    @Mock private ExecutionResourceUsageRepository resourceUsageRepository;
    @Mock private InventoryItemRepository inventoryItemRepository;
    @Mock private InventoryMovementService inventoryMovementService;
    @Mock private ProviderProfileRepository providerProfileRepository;
    @Mock private ClientProfileRepository clientProfileRepository;
    @Mock private UserRepository userRepository;

    private JobCostingService service;

    private User providerUser;
    private ProviderProfile providerProfile;
    private ServiceRequest inProgressRequest;
    private Proposal acceptedProposal;
    private ServiceExecution checkedInExecution;
    private ServiceExecution completedExecution;
    private TeamMember teamMember;
    private InventoryItem item;

    @BeforeEach
    void setUp() {
        service = new JobCostingService(
                executionRepository, assignmentRepository, resourceUsageRepository,
                inventoryItemRepository, inventoryMovementService,
                providerProfileRepository, clientProfileRepository, userRepository);

        ReflectionTestUtils.setField(service, "commissionRate", new BigDecimal("0.1200"));

        providerUser = UserFixture.aProviderUser().build();
        providerProfile = UserFixture.aProviderProfile().user(providerUser).build();

        inProgressRequest = ServiceRequestFixture.aRequest()
                .status(RequestStatus.IN_PROGRESS)
                .client(UserFixture.aClientUser().build())
                .category(ServiceRequestFixture.aCategory().build())
                .build();

        acceptedProposal = ProposalFixture.aProposal()
                .status(ProposalStatus.ACCEPTED)
                .request(inProgressRequest)
                .provider(providerProfile)
                .price(new BigDecimal("1000.00"))
                .build();

        checkedInExecution = ExecutionFixture.aCheckedInExecution()
                .proposal(acceptedProposal)
                .build();

        completedExecution = ExecutionFixture.aCompletedExecution()
                .proposal(acceptedProposal)
                .build();

        teamMember = ExecutionFixture.aTeamMember()
                .provider(providerProfile)
                .hourlyRate(new BigDecimal("10.00"))
                .build();

        item = InventoryFixture.anInventoryItem()
                .provider(providerProfile)
                .quantity(new BigDecimal("100.000"))
                .costPerUnit(new BigDecimal("2.0000"))
                .build();
    }

    // =========================================================================
    // getCosts
    // =========================================================================
    @Nested
    class GetCosts {

        @Test
        void getCosts_givenExecutionWithoutData_shouldReturnZeroCosts() {
            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(resourceUsageRepository.findByExecutionIdOrderByCreatedAtAsc(1L)).thenReturn(List.of());
            when(assignmentRepository.findByExecutionId(1L)).thenReturn(List.of());

            JobCostsResponse response = service.getCosts(1L, 2L);

            assertEquals(new BigDecimal("1000.00"), response.revenue());
            assertEquals(new BigDecimal("0.00"), response.materialsCost());
            assertEquals(new BigDecimal("0.00"), response.laborCost());
            // 1000 * 0.12 = 120.00
            assertEquals(new BigDecimal("120.00"), response.commission());
            // 1000 - 0 - 0 - 120 = 880
            assertEquals(new BigDecimal("880.00"), response.netProfit());
            // 880 / 1000 * 100 = 88.00
            assertEquals(new BigDecimal("88.00"), response.marginPercent());
            assertEquals(0, response.assignmentsMissingRate());
            assertTrue(response.assignments().isEmpty());
            assertTrue(response.resourceUsages().isEmpty());
        }

        @Test
        void getCosts_givenZeroRevenue_shouldReturnZeroMargin() {
            Proposal zeroPriceProposal = ProposalFixture.aProposal()
                    .status(ProposalStatus.ACCEPTED)
                    .request(inProgressRequest)
                    .provider(providerProfile)
                    .price(BigDecimal.ZERO)
                    .build();
            ServiceExecution zeroExec = ExecutionFixture.aCheckedInExecution()
                    .proposal(zeroPriceProposal)
                    .build();

            when(executionRepository.findById(1L)).thenReturn(Optional.of(zeroExec));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(resourceUsageRepository.findByExecutionIdOrderByCreatedAtAsc(1L)).thenReturn(List.of());
            when(assignmentRepository.findByExecutionId(1L)).thenReturn(List.of());

            JobCostsResponse response = service.getCosts(1L, 2L);

            assertEquals(new BigDecimal("0.00"), response.revenue());
            assertEquals(new BigDecimal("0.00"), response.marginPercent());
        }

        @Test
        void getCosts_givenAssignmentsWithMixedRates_shouldComputeLaborAndFlagMissing() {
            TeamMember memberNoRate = ExecutionFixture.aTeamMember()
                    .id(2L).name("Op sem taxa")
                    .provider(providerProfile)
                    .hourlyRate(null)
                    .build();

            ExecutionAssignment withHours = ExecutionFixture.anAssignment()
                    .id(10L).execution(checkedInExecution).teamMember(teamMember)
                    .hoursWorked(new BigDecimal("8.00"))
                    .build();
            ExecutionAssignment missingRate = ExecutionFixture.anAssignment()
                    .id(11L).execution(checkedInExecution).teamMember(memberNoRate)
                    .hoursWorked(new BigDecimal("4.00"))
                    .build();

            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(resourceUsageRepository.findByExecutionIdOrderByCreatedAtAsc(1L)).thenReturn(List.of());
            when(assignmentRepository.findByExecutionId(1L)).thenReturn(List.of(withHours, missingRate));

            JobCostsResponse response = service.getCosts(1L, 2L);

            // labor = 8 * 10 = 80.00 (second assignment has no rate → contributes 0)
            assertEquals(new BigDecimal("80.00"), response.laborCost());
            assertEquals(1, response.assignmentsMissingRate());
            assertEquals(2, response.assignments().size());
        }

        @Test
        void getCosts_givenCompletedExecution_shouldUseSnapshotRateNotCurrentRate() {
            // Snapshot 5€/h locked in at completion; member's current rate moved to 20€/h.
            // Completed execution must compute from snapshot.
            teamMember.setHourlyRate(new BigDecimal("20.00"));
            ExecutionAssignment a = ExecutionFixture.anAssignment()
                    .execution(completedExecution).teamMember(teamMember)
                    .hoursWorked(new BigDecimal("4.00"))
                    .hourlyRateSnapshot(new BigDecimal("5.00"))
                    .build();

            when(executionRepository.findById(1L)).thenReturn(Optional.of(completedExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(resourceUsageRepository.findByExecutionIdOrderByCreatedAtAsc(1L)).thenReturn(List.of());
            when(assignmentRepository.findByExecutionId(1L)).thenReturn(List.of(a));

            JobCostsResponse response = service.getCosts(1L, 2L);

            assertTrue(response.completed());
            // labor = 4 * 5 = 20.00 (NOT 4 * 20)
            assertEquals(new BigDecimal("20.00"), response.laborCost());
            assertEquals(new BigDecimal("5.00"), response.assignments().get(0).effectiveHourlyRate());
        }

        @Test
        void getCosts_givenResourceUsages_shouldSumMaterials() {
            InventoryMovement mv = InventoryMovement.builder().id(1L).build();
            ExecutionResourceUsage u1 = ExecutionResourceUsage.builder()
                    .id(1L).execution(checkedInExecution).inventoryItem(item)
                    .quantity(new BigDecimal("10.000"))
                    .unitCostSnapshot(new BigDecimal("2.0000"))
                    .totalCost(new BigDecimal("20.0000"))
                    .inventoryMovement(mv)
                    .recordedBy(providerUser)
                    .createdAt(Instant.now())
                    .build();
            ExecutionResourceUsage u2 = ExecutionResourceUsage.builder()
                    .id(2L).execution(checkedInExecution).inventoryItem(item)
                    .quantity(new BigDecimal("5.000"))
                    .unitCostSnapshot(new BigDecimal("3.0000"))
                    .totalCost(new BigDecimal("15.0000"))
                    .inventoryMovement(mv)
                    .recordedBy(providerUser)
                    .createdAt(Instant.now())
                    .build();

            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(resourceUsageRepository.findByExecutionIdOrderByCreatedAtAsc(1L)).thenReturn(List.of(u1, u2));
            when(assignmentRepository.findByExecutionId(1L)).thenReturn(List.of());
            when(clientProfileRepository.findByUserId(providerUser.getId())).thenReturn(Optional.empty());
            when(providerProfileRepository.findByUserId(providerUser.getId())).thenReturn(Optional.of(providerProfile));

            JobCostsResponse response = service.getCosts(1L, 2L);

            // 20 + 15 = 35.00
            assertEquals(new BigDecimal("35.00"), response.materialsCost());
            assertEquals(2, response.resourceUsages().size());
        }

        @Test
        void getCosts_givenWrongProvider_shouldThrowForbidden() {
            ProviderProfile other = UserFixture.aProviderProfile().id(99L)
                    .user(UserFixture.aProviderUser().id(99L).build()).build();
            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(99L)).thenReturn(Optional.of(other));

            assertThrows(ForbiddenException.class, () -> service.getCosts(1L, 99L));
        }

        @Test
        void getCosts_givenNonProviderUser_shouldThrowForbidden() {
            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(50L)).thenReturn(Optional.empty());

            assertThrows(ForbiddenException.class, () -> service.getCosts(1L, 50L));
        }

        @Test
        void getCosts_givenUnknownExecution_shouldThrowNotFound() {
            when(executionRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> service.getCosts(999L, 2L));
        }
    }

    // =========================================================================
    // recordResourceUsage
    // =========================================================================
    @Nested
    class RecordResourceUsage {

        @Test
        void recordResourceUsage_shouldDelegateConsumptionAndSnapshotWac() {
            RecordResourceUsageDto dto = new RecordResourceUsageDto(
                    1L, new BigDecimal("12.500"), "Adubo aplicado no talhão A");

            InventoryMovement movement = InventoryMovement.builder().id(50L).build();

            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(inventoryItemRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(item));
            when(inventoryMovementService.recordConsumption(eq(1L), any(BigDecimal.class), eq(checkedInExecution),
                    any(String.class), eq(2L))).thenReturn(movement);
            when(userRepository.findById(2L)).thenReturn(Optional.of(providerUser));
            when(resourceUsageRepository.saveAndFlush(any(ExecutionResourceUsage.class)))
                    .thenAnswer(inv -> {
                        ExecutionResourceUsage u = inv.getArgument(0);
                        u.setId(77L);
                        u.setTotalCost(u.getQuantity().multiply(u.getUnitCostSnapshot()));
                        u.setCreatedAt(Instant.now());
                        return u;
                    });
            when(clientProfileRepository.findByUserId(2L)).thenReturn(Optional.empty());

            ArgumentCaptor<ExecutionResourceUsage> captor = ArgumentCaptor.forClass(ExecutionResourceUsage.class);

            ExecutionResourceUsageResponse response = service.recordResourceUsage(1L, dto, 2L);

            verify(resourceUsageRepository).saveAndFlush(captor.capture());
            ExecutionResourceUsage saved = captor.getValue();

            // Quantity normalised to scale 3, cost snapshot at WAC=2.0000
            assertEquals(new BigDecimal("12.500"), saved.getQuantity());
            assertEquals(new BigDecimal("2.0000"), saved.getUnitCostSnapshot());
            assertEquals(movement, saved.getInventoryMovement());
            assertEquals(providerUser, saved.getRecordedBy());
            assertEquals("Adubo aplicado no talhão A", saved.getNotes());

            assertEquals(77L, response.id());
            assertEquals(item.getId(), response.inventoryItemId());

            verify(inventoryMovementService).recordConsumption(eq(1L), eq(new BigDecimal("12.500")),
                    eq(checkedInExecution), any(String.class), eq(2L));
        }

        @Test
        void recordResourceUsage_givenZeroWac_shouldSnapshotZero() {
            // Item with no purchases yet — costPerUnit is null. Service should
            // snapshot ZERO (not NPE) so consumption is recorded but contributes
            // 0 to materials cost.
            item.setCostPerUnit(null);
            RecordResourceUsageDto dto = new RecordResourceUsageDto(
                    1L, new BigDecimal("1.000"), null);

            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(inventoryItemRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(item));
            when(inventoryMovementService.recordConsumption(anyLong(), any(BigDecimal.class), any(), any(), anyLong()))
                    .thenReturn(InventoryMovement.builder().id(1L).build());
            when(userRepository.findById(2L)).thenReturn(Optional.of(providerUser));
            when(clientProfileRepository.findByUserId(2L)).thenReturn(Optional.empty());

            ArgumentCaptor<ExecutionResourceUsage> captor = ArgumentCaptor.forClass(ExecutionResourceUsage.class);
            when(resourceUsageRepository.saveAndFlush(captor.capture()))
                    .thenAnswer(inv -> {
                        ExecutionResourceUsage u = inv.getArgument(0);
                        u.setId(1L);
                        return u;
                    });

            service.recordResourceUsage(1L, dto, 2L);

            assertEquals(new BigDecimal("0.0000"), captor.getValue().getUnitCostSnapshot());
        }

        @Test
        void recordResourceUsage_givenCompletedExecution_shouldThrowInvalidState() {
            RecordResourceUsageDto dto = new RecordResourceUsageDto(1L, new BigDecimal("1.000"), null);
            when(executionRepository.findById(1L)).thenReturn(Optional.of(completedExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

            assertThrows(InvalidStateException.class, () -> service.recordResourceUsage(1L, dto, 2L));
            verify(inventoryMovementService, never()).recordConsumption(anyLong(), any(), any(), any(), anyLong());
        }

        @Test
        void recordResourceUsage_givenNoCheckin_shouldThrowInvalidState() {
            ServiceExecution noCheckin = ExecutionFixture.anExecution().proposal(acceptedProposal).build();
            RecordResourceUsageDto dto = new RecordResourceUsageDto(1L, new BigDecimal("1.000"), null);

            when(executionRepository.findById(1L)).thenReturn(Optional.of(noCheckin));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

            assertThrows(InvalidStateException.class, () -> service.recordResourceUsage(1L, dto, 2L));
        }

        @Test
        void recordResourceUsage_givenItemFromAnotherProvider_shouldThrowNotFound() {
            RecordResourceUsageDto dto = new RecordResourceUsageDto(1L, new BigDecimal("1.000"), null);
            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(inventoryItemRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> service.recordResourceUsage(1L, dto, 2L));
        }

        @Test
        void recordResourceUsage_givenWrongProvider_shouldThrowForbidden() {
            ProviderProfile other = UserFixture.aProviderProfile().id(99L)
                    .user(UserFixture.aProviderUser().id(99L).build()).build();
            RecordResourceUsageDto dto = new RecordResourceUsageDto(1L, new BigDecimal("1.000"), null);

            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(99L)).thenReturn(Optional.of(other));

            assertThrows(ForbiddenException.class, () -> service.recordResourceUsage(1L, dto, 99L));
        }
    }

    // =========================================================================
    // deleteResourceUsage
    // =========================================================================
    @Nested
    class DeleteResourceUsage {

        @Test
        void deleteResourceUsage_shouldReverseViaAdjustmentInAtSnapshotCost() {
            ExecutionResourceUsage usage = ExecutionResourceUsage.builder()
                    .id(77L).execution(checkedInExecution).inventoryItem(item)
                    .quantity(new BigDecimal("5.000"))
                    .unitCostSnapshot(new BigDecimal("3.0000"))
                    .recordedBy(providerUser)
                    .build();

            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(resourceUsageRepository.findById(77L)).thenReturn(Optional.of(usage));

            service.deleteResourceUsage(1L, 77L, 2L);

            ArgumentCaptor<RecordAdjustmentInDto> captor = ArgumentCaptor.forClass(RecordAdjustmentInDto.class);
            verify(inventoryMovementService).recordAdjustmentIn(eq(item.getId()), captor.capture(), eq(2L));

            RecordAdjustmentInDto adjustment = captor.getValue();
            assertEquals(new BigDecimal("5.000"), adjustment.quantity());
            assertEquals(new BigDecimal("3.0000"), adjustment.unitCost());
            assertTrue(adjustment.reason().contains("77"));

            verify(resourceUsageRepository).delete(usage);
        }

        @Test
        void deleteResourceUsage_givenUsageFromOtherExecution_shouldThrowNotFound() {
            ServiceExecution otherExec = ExecutionFixture.aCheckedInExecution()
                    .id(999L).proposal(acceptedProposal).build();
            ExecutionResourceUsage usage = ExecutionResourceUsage.builder()
                    .id(77L).execution(otherExec).inventoryItem(item)
                    .quantity(new BigDecimal("5.000"))
                    .unitCostSnapshot(new BigDecimal("3.0000"))
                    .build();

            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(resourceUsageRepository.findById(77L)).thenReturn(Optional.of(usage));

            assertThrows(ResourceNotFoundException.class,
                    () -> service.deleteResourceUsage(1L, 77L, 2L));
            verify(resourceUsageRepository, never()).delete(any());
        }

        @Test
        void deleteResourceUsage_givenCompletedExecution_shouldThrowInvalidState() {
            when(executionRepository.findById(1L)).thenReturn(Optional.of(completedExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

            assertThrows(InvalidStateException.class,
                    () -> service.deleteResourceUsage(1L, 77L, 2L));
            verify(resourceUsageRepository, never()).delete(any());
        }

        @Test
        void deleteResourceUsage_givenUnknownUsage_shouldThrowNotFound() {
            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(resourceUsageRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> service.deleteResourceUsage(1L, 999L, 2L));
        }
    }

    // =========================================================================
    // updateAssignmentHours
    // =========================================================================
    @Nested
    class UpdateAssignmentHours {

        @Test
        void updateAssignmentHours_shouldPersistAndReturnPreviewedLabor() {
            ExecutionAssignment assignment = ExecutionFixture.anAssignment()
                    .id(10L).execution(checkedInExecution).teamMember(teamMember)
                    .build();
            UpdateAssignmentHoursDto dto = new UpdateAssignmentHoursDto(
                    new BigDecimal("8.00"), new BigDecimal("6.50"));

            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(assignmentRepository.findById(10L)).thenReturn(Optional.of(assignment));
            when(assignmentRepository.save(any(ExecutionAssignment.class))).thenAnswer(inv -> inv.getArgument(0));

            AssignmentCostResponse response = service.updateAssignmentHours(1L, 10L, dto, 2L);

            assertEquals(new BigDecimal("8.00"), assignment.getHoursWorked());
            assertEquals(new BigDecimal("6.50"), assignment.getMachineHours());
            // Preview uses member's current rate (10€/h) because snapshot is null pre-completion.
            assertEquals(new BigDecimal("10.00"), response.effectiveHourlyRate());
            // 8 * 10 = 80.00
            assertEquals(new BigDecimal("80.00"), response.laborCost());
        }

        @Test
        void updateAssignmentHours_givenNullHours_shouldReturnZeroLabor() {
            ExecutionAssignment assignment = ExecutionFixture.anAssignment()
                    .id(10L).execution(checkedInExecution).teamMember(teamMember)
                    .build();
            UpdateAssignmentHoursDto dto = new UpdateAssignmentHoursDto(null, null);

            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(assignmentRepository.findById(10L)).thenReturn(Optional.of(assignment));
            when(assignmentRepository.save(any(ExecutionAssignment.class))).thenAnswer(inv -> inv.getArgument(0));

            AssignmentCostResponse response = service.updateAssignmentHours(1L, 10L, dto, 2L);

            assertNull(assignment.getHoursWorked());
            assertNull(assignment.getMachineHours());
            assertEquals(new BigDecimal("0.00"), response.laborCost());
        }

        @Test
        void updateAssignmentHours_givenCompletedExecution_shouldThrowInvalidState() {
            UpdateAssignmentHoursDto dto = new UpdateAssignmentHoursDto(
                    new BigDecimal("8.00"), null);
            when(executionRepository.findById(1L)).thenReturn(Optional.of(completedExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

            assertThrows(InvalidStateException.class,
                    () -> service.updateAssignmentHours(1L, 10L, dto, 2L));
            verify(assignmentRepository, never()).save(any());
        }

        @Test
        void updateAssignmentHours_givenAssignmentFromOtherExecution_shouldThrowNotFound() {
            ServiceExecution otherExec = ExecutionFixture.aCheckedInExecution()
                    .id(999L).proposal(acceptedProposal).build();
            ExecutionAssignment foreign = ExecutionFixture.anAssignment()
                    .id(10L).execution(otherExec).teamMember(teamMember)
                    .build();
            UpdateAssignmentHoursDto dto = new UpdateAssignmentHoursDto(new BigDecimal("8.00"), null);

            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(assignmentRepository.findById(10L)).thenReturn(Optional.of(foreign));

            assertThrows(ResourceNotFoundException.class,
                    () -> service.updateAssignmentHours(1L, 10L, dto, 2L));
            verify(assignmentRepository, never()).save(any());
        }

        @Test
        void updateAssignmentHours_givenUnknownAssignment_shouldThrowNotFound() {
            UpdateAssignmentHoursDto dto = new UpdateAssignmentHoursDto(new BigDecimal("1.00"), null);
            when(executionRepository.findById(1L)).thenReturn(Optional.of(checkedInExecution));
            when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
            when(assignmentRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> service.updateAssignmentHours(1L, 999L, dto, 2L));
        }
    }
}
