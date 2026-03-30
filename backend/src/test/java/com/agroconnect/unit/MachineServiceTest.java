package com.agroconnect.unit;

import com.agroconnect.dto.request.CreateMachineDto;
import com.agroconnect.dto.request.UpdateMachineDto;
import com.agroconnect.dto.response.MachineResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.fixture.ExecutionFixture;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.Machine;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.MachineStatus;
import com.agroconnect.repository.MachineRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.service.MachineService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MachineServiceTest {

    @Mock private MachineRepository machineRepository;
    @Mock private ProviderProfileRepository providerProfileRepository;

    private MachineService service;

    private User providerUser;
    private ProviderProfile providerProfile;
    private Machine machine;

    @BeforeEach
    void setUp() {
        service = new MachineService(machineRepository, providerProfileRepository);

        providerUser = UserFixture.aProviderUser().build();
        providerProfile = UserFixture.aProviderProfile().user(providerUser).build();
        machine = ExecutionFixture.aMachine().provider(providerProfile).build();
    }

    @Test
    void create_givenValidData_shouldCreateMachine() {
        CreateMachineDto dto = new CreateMachineDto("Pulverizador", "Pulverizador", "200L", "CC-11-DD", null);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.save(any(Machine.class))).thenReturn(machine);

        MachineResponse response = service.create(dto, 2L);

        assertNotNull(response);
        assertEquals(MachineStatus.AVAILABLE, response.status());
        verify(machineRepository).save(any(Machine.class));
    }

    @Test
    void update_givenStatusChange_shouldUpdateStatus() {
        UpdateMachineDto dto = new UpdateMachineDto("Trator JD", "Trator", null, MachineStatus.MAINTENANCE, null, null, null);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(machineRepository.save(any(Machine.class))).thenReturn(machine);

        service.update(1L, dto, 2L);

        assertEquals(MachineStatus.MAINTENANCE, machine.getStatus());
    }

    @Test
    void delete_givenRetiredMachine_shouldDelete() {
        machine.setStatus(MachineStatus.RETIRED);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));

        service.delete(1L, 2L);

        verify(machineRepository).delete(machine);
    }

    @Test
    void delete_givenNonRetiredMachine_shouldThrowInvalidState() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));

        assertThrows(InvalidStateException.class, () -> service.delete(1L, 2L));
    }

    @Test
    void getById_givenWrongProvider_shouldThrowForbidden() {
        when(providerProfileRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThrows(ForbiddenException.class, () -> service.getById(1L, 99L));
    }

    @Test
    void getById_givenValidMachine_shouldReturnResponse() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));

        MachineResponse response = service.getById(1L, 2L);

        assertNotNull(response);
        assertEquals(MachineStatus.AVAILABLE, response.status());
    }

    @Test
    void getById_givenNonExistentMachine_shouldThrowNotFound() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(999L, 1L)).thenReturn(Optional.empty());

        assertThrows(com.agroconnect.exception.ResourceNotFoundException.class,
                () -> service.getById(999L, 2L));
    }

    @Test
    void listByProvider_shouldReturnAllMachines() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByProviderId(1L)).thenReturn(java.util.List.of(machine));

        java.util.List<MachineResponse> result = service.listByProvider(2L);

        assertEquals(1, result.size());
    }

    @Test
    void listByProviderAndStatus_shouldReturnFilteredMachines() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByProviderIdAndStatus(1L, MachineStatus.AVAILABLE))
                .thenReturn(java.util.List.of(machine));

        java.util.List<MachineResponse> result = service.listByProviderAndStatus(2L, MachineStatus.AVAILABLE);

        assertEquals(1, result.size());
    }

    @Test
    void update_givenNullStatus_shouldNotChangeStatus() {
        UpdateMachineDto dto = new UpdateMachineDto("Trator", "Trator", null, null, null, null, null);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(machineRepository.save(any(Machine.class))).thenReturn(machine);

        service.update(1L, dto, 2L);

        assertEquals(MachineStatus.AVAILABLE, machine.getStatus());
    }

    @Test
    void update_givenNonExistentMachine_shouldThrowNotFound() {
        UpdateMachineDto dto = new UpdateMachineDto("Trator", "Trator", null, null, null, null, null);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(999L, 1L)).thenReturn(Optional.empty());

        assertThrows(com.agroconnect.exception.ResourceNotFoundException.class,
                () -> service.update(999L, dto, 2L));
    }

    @Test
    void delete_givenNonExistentMachine_shouldThrowNotFound() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(999L, 1L)).thenReturn(Optional.empty());

        assertThrows(com.agroconnect.exception.ResourceNotFoundException.class,
                () -> service.delete(999L, 2L));
    }
}
