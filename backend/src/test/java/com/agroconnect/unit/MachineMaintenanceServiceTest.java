package com.agroconnect.unit;

import com.agroconnect.dto.request.CreateMaintenanceLogDto;
import com.agroconnect.dto.response.MachineMaintenanceLogResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.fixture.ExecutionFixture;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.Machine;
import com.agroconnect.model.MachineMaintenanceLog;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.MaintenanceType;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.MachineMaintenanceLogRepository;
import com.agroconnect.repository.MachineRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.UserRepository;
import com.agroconnect.service.MachineMaintenanceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MachineMaintenanceServiceTest {

    @Mock private MachineRepository machineRepository;
    @Mock private MachineMaintenanceLogRepository maintenanceRepository;
    @Mock private ProviderProfileRepository providerProfileRepository;
    @Mock private ClientProfileRepository clientProfileRepository;
    @Mock private UserRepository userRepository;

    private MachineMaintenanceService service;

    private User providerUser;
    private ProviderProfile providerProfile;
    private Machine machine;

    @BeforeEach
    void setUp() {
        service = new MachineMaintenanceService(
                machineRepository, maintenanceRepository,
                providerProfileRepository, clientProfileRepository, userRepository);

        providerUser = UserFixture.aProviderUser().build();
        providerProfile = UserFixture.aProviderProfile().user(providerUser).build();
        machine = ExecutionFixture.aMachine().provider(providerProfile).build();
    }

    @Test
    void list_givenValidProvider_shouldReturnLogs() {
        MachineMaintenanceLog log = MachineMaintenanceLog.builder()
                .id(10L)
                .machine(machine)
                .maintenanceType(MaintenanceType.ROUTINE)
                .description("Mudança de óleo")
                .cost(new BigDecimal("120.00"))
                .performedAt(LocalDate.of(2026, 5, 1))
                .createdBy(providerUser)
                .build();

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(maintenanceRepository.findByMachineIdOrderByPerformedAtDesc(1L)).thenReturn(List.of(log));
        when(clientProfileRepository.findByUserId(2L)).thenReturn(Optional.empty());
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

        List<MachineMaintenanceLogResponse> result = service.list(1L, 2L);

        assertEquals(1, result.size());
        assertEquals(MaintenanceType.ROUTINE, result.get(0).maintenanceType());
        assertEquals(providerProfile.getCompanyName(), result.get(0).createdByName());
    }

    @Test
    void list_givenNotProvider_shouldThrowForbidden() {
        when(providerProfileRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThrows(ForbiddenException.class, () -> service.list(1L, 99L));
    }

    @Test
    void list_givenMachineOfAnotherProvider_shouldThrowNotFound() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(999L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.list(999L, 2L));
    }

    @Test
    void create_givenValidData_shouldSaveLogAndSyncMachineDates() {
        CreateMaintenanceLogDto dto = new CreateMaintenanceLogDto(
                MaintenanceType.ROUTINE,
                "Mudança de óleo e filtros",
                new BigDecimal("150.00"),
                "Oficina Silva",
                LocalDate.of(2026, 5, 10),
                LocalDate.of(2026, 11, 10),
                null
        );

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(userRepository.findById(2L)).thenReturn(Optional.of(providerUser));
        when(maintenanceRepository.save(any(MachineMaintenanceLog.class))).thenAnswer(inv -> {
            MachineMaintenanceLog entry = inv.getArgument(0);
            entry.setId(20L);
            return entry;
        });
        when(clientProfileRepository.findByUserId(2L)).thenReturn(Optional.empty());

        MachineMaintenanceLogResponse response = service.create(1L, dto, 2L);

        assertNotNull(response);
        assertEquals(MaintenanceType.ROUTINE, response.maintenanceType());
        assertEquals(LocalDate.of(2026, 5, 10), machine.getLastMaintenanceDate());
        assertEquals(LocalDate.of(2026, 11, 10), machine.getNextMaintenanceDate());
        verify(machineRepository).save(machine);
    }

    @Test
    void create_givenOlderPerformedAt_shouldNotOverwriteLastMaintenanceDate() {
        machine.setLastMaintenanceDate(LocalDate.of(2026, 4, 1));
        CreateMaintenanceLogDto dto = new CreateMaintenanceLogDto(
                MaintenanceType.REPAIR,
                "Reparação tardia registada",
                new BigDecimal("80.00"),
                null,
                LocalDate.of(2026, 3, 1),
                null,
                null
        );

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(userRepository.findById(2L)).thenReturn(Optional.of(providerUser));
        when(maintenanceRepository.save(any(MachineMaintenanceLog.class))).thenAnswer(inv -> inv.getArgument(0));
        when(clientProfileRepository.findByUserId(2L)).thenReturn(Optional.empty());

        service.create(1L, dto, 2L);

        assertEquals(LocalDate.of(2026, 4, 1), machine.getLastMaintenanceDate());
    }

    @Test
    void create_givenNullNextDueAt_shouldKeepExistingNextMaintenance() {
        machine.setNextMaintenanceDate(LocalDate.of(2026, 12, 1));
        CreateMaintenanceLogDto dto = new CreateMaintenanceLogDto(
                MaintenanceType.INSPECTION,
                "Inspeção",
                null,
                null,
                LocalDate.of(2026, 5, 10),
                null,
                null
        );

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(userRepository.findById(2L)).thenReturn(Optional.of(providerUser));
        when(maintenanceRepository.save(any(MachineMaintenanceLog.class))).thenAnswer(inv -> inv.getArgument(0));
        when(clientProfileRepository.findByUserId(2L)).thenReturn(Optional.empty());

        service.create(1L, dto, 2L);

        assertEquals(LocalDate.of(2026, 12, 1), machine.getNextMaintenanceDate());
    }

    @Test
    void create_shouldPersistLogWithCreatedByActor() {
        CreateMaintenanceLogDto dto = new CreateMaintenanceLogDto(
                MaintenanceType.ROUTINE, "x", null, null,
                LocalDate.of(2026, 5, 10), null, null);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(userRepository.findById(2L)).thenReturn(Optional.of(providerUser));
        when(maintenanceRepository.save(any(MachineMaintenanceLog.class))).thenAnswer(inv -> inv.getArgument(0));
        when(clientProfileRepository.findByUserId(2L)).thenReturn(Optional.empty());

        ArgumentCaptor<MachineMaintenanceLog> captor = ArgumentCaptor.forClass(MachineMaintenanceLog.class);
        service.create(1L, dto, 2L);

        verify(maintenanceRepository).save(captor.capture());
        assertEquals(providerUser, captor.getValue().getCreatedBy());
        assertEquals(machine, captor.getValue().getMachine());
    }

    @Test
    void create_givenMissingUser_shouldThrowNotFound() {
        CreateMaintenanceLogDto dto = new CreateMaintenanceLogDto(
                MaintenanceType.ROUTINE, "x", null, null,
                LocalDate.of(2026, 5, 10), null, null);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(userRepository.findById(2L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.create(1L, dto, 2L));
        verify(maintenanceRepository, never()).save(any());
    }

    @Test
    void delete_givenValidLog_shouldDelete() {
        MachineMaintenanceLog log = MachineMaintenanceLog.builder()
                .id(30L).machine(machine)
                .maintenanceType(MaintenanceType.ROUTINE)
                .description("x").performedAt(LocalDate.of(2026, 1, 1))
                .createdBy(providerUser).build();

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(maintenanceRepository.findByIdAndMachineId(30L, 1L)).thenReturn(Optional.of(log));

        service.delete(1L, 30L, 2L);

        verify(maintenanceRepository).delete(log);
    }

    @Test
    void delete_givenNonExistentLog_shouldThrowNotFound() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(maintenanceRepository.findByIdAndMachineId(999L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.delete(1L, 999L, 2L));
    }

    @Test
    void list_shouldUseClientProfileNameWhenAvailable() {
        ClientProfile clientProfile = UserFixture.aClientProfile().build();
        MachineMaintenanceLog log = MachineMaintenanceLog.builder()
                .id(40L).machine(machine)
                .maintenanceType(MaintenanceType.ROUTINE)
                .description("x").performedAt(LocalDate.of(2026, 1, 1))
                .createdBy(providerUser).build();

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(maintenanceRepository.findByMachineIdOrderByPerformedAtDesc(1L)).thenReturn(List.of(log));
        when(clientProfileRepository.findByUserId(2L)).thenReturn(Optional.of(clientProfile));

        List<MachineMaintenanceLogResponse> result = service.list(1L, 2L);

        assertEquals(clientProfile.getName(), result.get(0).createdByName());
    }
}
