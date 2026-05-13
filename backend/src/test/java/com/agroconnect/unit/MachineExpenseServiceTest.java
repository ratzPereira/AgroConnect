package com.agroconnect.unit;

import com.agroconnect.dto.request.CreateMachineExpenseDto;
import com.agroconnect.dto.response.MachineExpenseResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.fixture.ExecutionFixture;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.Machine;
import com.agroconnect.model.MachineExpense;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.ExpenseCategory;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.MachineExpenseRepository;
import com.agroconnect.repository.MachineRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.UserRepository;
import com.agroconnect.service.MachineExpenseService;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MachineExpenseServiceTest {

    @Mock private MachineRepository machineRepository;
    @Mock private MachineExpenseRepository expenseRepository;
    @Mock private ProviderProfileRepository providerProfileRepository;
    @Mock private ClientProfileRepository clientProfileRepository;
    @Mock private UserRepository userRepository;

    private MachineExpenseService service;

    private User providerUser;
    private ProviderProfile providerProfile;
    private Machine machine;

    @BeforeEach
    void setUp() {
        service = new MachineExpenseService(
                machineRepository, expenseRepository,
                providerProfileRepository, clientProfileRepository, userRepository);

        providerUser = UserFixture.aProviderUser().build();
        providerProfile = UserFixture.aProviderProfile().user(providerUser).build();
        machine = ExecutionFixture.aMachine().provider(providerProfile).build();
    }

    @Test
    void list_givenValidProvider_shouldReturnExpenses() {
        MachineExpense expense = MachineExpense.builder()
                .id(10L)
                .machine(machine)
                .category(ExpenseCategory.FUEL)
                .description("Gasóleo")
                .amount(new BigDecimal("55.30"))
                .incurredAt(LocalDate.of(2026, 5, 5))
                .createdBy(providerUser)
                .build();

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(expenseRepository.findByMachineIdOrderByIncurredAtDesc(1L)).thenReturn(List.of(expense));
        when(clientProfileRepository.findByUserId(2L)).thenReturn(Optional.empty());

        List<MachineExpenseResponse> result = service.list(1L, 2L);

        assertEquals(1, result.size());
        assertEquals(ExpenseCategory.FUEL, result.get(0).category());
        assertEquals(new BigDecimal("55.30"), result.get(0).amount());
    }

    @Test
    void list_givenNotProvider_shouldThrowForbidden() {
        when(providerProfileRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThrows(ForbiddenException.class, () -> service.list(1L, 99L));
    }

    @Test
    void create_givenValidData_shouldSaveExpense() {
        CreateMachineExpenseDto dto = new CreateMachineExpenseDto(
                ExpenseCategory.PARTS,
                "Filtros novos",
                new BigDecimal("45.00"),
                LocalDate.of(2026, 5, 12),
                null
        );

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(userRepository.findById(2L)).thenReturn(Optional.of(providerUser));
        when(expenseRepository.save(any(MachineExpense.class))).thenAnswer(inv -> {
            MachineExpense e = inv.getArgument(0);
            e.setId(50L);
            return e;
        });
        when(clientProfileRepository.findByUserId(2L)).thenReturn(Optional.empty());

        ArgumentCaptor<MachineExpense> captor = ArgumentCaptor.forClass(MachineExpense.class);
        MachineExpenseResponse response = service.create(1L, dto, 2L);

        verify(expenseRepository).save(captor.capture());
        assertEquals(ExpenseCategory.PARTS, captor.getValue().getCategory());
        assertEquals(new BigDecimal("45.00"), captor.getValue().getAmount());
        assertEquals(providerUser, captor.getValue().getCreatedBy());
        assertEquals(50L, response.id());
    }

    @Test
    void create_givenMissingUser_shouldThrowNotFound() {
        CreateMachineExpenseDto dto = new CreateMachineExpenseDto(
                ExpenseCategory.FUEL, null, new BigDecimal("10.00"),
                LocalDate.of(2026, 5, 12), null);

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(userRepository.findById(2L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.create(1L, dto, 2L));
    }

    @Test
    void delete_givenValidExpense_shouldDelete() {
        MachineExpense expense = MachineExpense.builder()
                .id(60L).machine(machine).category(ExpenseCategory.OTHER)
                .amount(new BigDecimal("10.00"))
                .incurredAt(LocalDate.of(2026, 1, 1))
                .createdBy(providerUser).build();

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(expenseRepository.findByIdAndMachineId(60L, 1L)).thenReturn(Optional.of(expense));

        service.delete(1L, 60L, 2L);

        verify(expenseRepository).delete(expense);
    }

    @Test
    void delete_givenNonExistentExpense_shouldThrowNotFound() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(1L, 1L)).thenReturn(Optional.of(machine));
        when(expenseRepository.findByIdAndMachineId(999L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.delete(1L, 999L, 2L));
    }

    @Test
    void delete_givenMachineNotOwned_shouldThrowNotFound() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(machineRepository.findByIdAndProviderId(999L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.delete(999L, 1L, 2L));
    }
}
