package com.agroconnect.service;

import com.agroconnect.dto.request.CreateMachineExpenseDto;
import com.agroconnect.dto.response.MachineExpenseResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.mapper.MachineExpenseMapper;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.Machine;
import com.agroconnect.model.MachineExpense;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.User;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.MachineExpenseRepository;
import com.agroconnect.repository.MachineRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * CRUD for the per-machine operating-expense ledger. Records fuel, parts,
 * insurance, tax and miscellaneous costs that feed into the analytics view's
 * "operating cost" total.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MachineExpenseService {

    private static final Logger log = LoggerFactory.getLogger(MachineExpenseService.class);

    private static final String ERR_MACHINE_NOT_FOUND = "Máquina não encontrada.";
    private static final String ERR_PROVIDER_NOT_FOUND = "Perfil de prestador não encontrado.";
    private static final String ERR_EXPENSE_NOT_FOUND = "Despesa não encontrada.";
    private static final String ERR_USER_NOT_FOUND = "Utilizador não encontrado.";

    private final MachineRepository machineRepository;
    private final MachineExpenseRepository expenseRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final UserRepository userRepository;

    public List<MachineExpenseResponse> list(Long machineId, Long userId) {
        ensureMachineAccess(machineId, userId);
        return expenseRepository.findByMachineIdOrderByIncurredAtDesc(machineId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public MachineExpenseResponse create(Long machineId, CreateMachineExpenseDto dto, Long userId) {
        Machine machine = ensureMachineAccess(machineId, userId);
        User actor = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_USER_NOT_FOUND));

        MachineExpense entry = MachineExpense.builder()
                .machine(machine)
                .category(dto.category())
                .description(dto.description())
                .amount(dto.amount())
                .incurredAt(dto.incurredAt())
                .notes(dto.notes())
                .createdBy(actor)
                .build();
        entry = expenseRepository.save(entry);

        log.info("Expense {} ({}) created for machine {} amount={}",
                entry.getId(), dto.category(), machineId, dto.amount());
        return toResponse(entry);
    }

    @Transactional
    public void delete(Long machineId, Long expenseId, Long userId) {
        ensureMachineAccess(machineId, userId);
        MachineExpense entry = expenseRepository.findByIdAndMachineId(expenseId, machineId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_EXPENSE_NOT_FOUND));
        expenseRepository.delete(entry);
        log.info("Expense {} deleted from machine {}", expenseId, machineId);
    }

    // ─────────────────────── helpers ───────────────────────

    private Machine ensureMachineAccess(Long machineId, Long userId) {
        ProviderProfile provider = providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ForbiddenException(ERR_PROVIDER_NOT_FOUND));
        return machineRepository.findByIdAndProviderId(machineId, provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException(ERR_MACHINE_NOT_FOUND));
    }

    private MachineExpenseResponse toResponse(MachineExpense entry) {
        return MachineExpenseMapper.toResponse(entry, displayNameOf(entry.getCreatedBy()));
    }

    private String displayNameOf(User user) {
        return clientProfileRepository.findByUserId(user.getId())
                .map(ClientProfile::getName)
                .orElseGet(() -> providerProfileRepository.findByUserId(user.getId())
                        .map(ProviderProfile::getCompanyName)
                        .orElse(user.getEmail()));
    }
}
