package com.agroconnect.service;

import com.agroconnect.dto.request.CreateMaintenanceLogDto;
import com.agroconnect.dto.response.MachineMaintenanceLogResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.mapper.MachineMaintenanceLogMapper;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.Machine;
import com.agroconnect.model.MachineMaintenanceLog;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.User;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.MachineMaintenanceLogRepository;
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
 * CRUD for the machine maintenance ledger. Creating a log entry also
 * updates the machine's last_maintenance_date / next_maintenance_date
 * convenience fields so the machine list view shows current state
 * without having to join the ledger.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MachineMaintenanceService {

    private static final Logger log = LoggerFactory.getLogger(MachineMaintenanceService.class);

    private static final String ERR_MACHINE_NOT_FOUND = "Máquina não encontrada.";
    private static final String ERR_PROVIDER_NOT_FOUND = "Perfil de prestador não encontrado.";
    private static final String ERR_LOG_NOT_FOUND = "Registo de manutenção não encontrado.";
    private static final String ERR_USER_NOT_FOUND = "Utilizador não encontrado.";

    private final MachineRepository machineRepository;
    private final MachineMaintenanceLogRepository maintenanceRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final UserRepository userRepository;

    public List<MachineMaintenanceLogResponse> list(Long machineId, Long userId) {
        ensureMachineAccess(machineId, userId);
        return maintenanceRepository.findByMachineIdOrderByPerformedAtDesc(machineId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public MachineMaintenanceLogResponse create(Long machineId, CreateMaintenanceLogDto dto, Long userId) {
        Machine machine = ensureMachineAccess(machineId, userId);
        User actor = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_USER_NOT_FOUND));

        MachineMaintenanceLog entry = MachineMaintenanceLog.builder()
                .machine(machine)
                .maintenanceType(dto.maintenanceType())
                .description(dto.description())
                .cost(dto.cost())
                .workshopName(dto.workshopName())
                .performedAt(dto.performedAt())
                .nextDueAt(dto.nextDueAt())
                .notes(dto.notes())
                .createdBy(actor)
                .build();
        entry = maintenanceRepository.save(entry);

        // Keep machine summary fields in sync so the listing reflects state without a join.
        if (machine.getLastMaintenanceDate() == null
                || dto.performedAt().isAfter(machine.getLastMaintenanceDate())) {
            machine.setLastMaintenanceDate(dto.performedAt());
        }
        if (dto.nextDueAt() != null) {
            machine.setNextMaintenanceDate(dto.nextDueAt());
        }
        machineRepository.save(machine);

        log.info("Maintenance log {} created for machine {} (type {})",
                entry.getId(), machineId, dto.maintenanceType());
        return toResponse(entry);
    }

    @Transactional
    public void delete(Long machineId, Long logId, Long userId) {
        ensureMachineAccess(machineId, userId);
        MachineMaintenanceLog entry = maintenanceRepository.findByIdAndMachineId(logId, machineId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_LOG_NOT_FOUND));
        maintenanceRepository.delete(entry);
        log.info("Maintenance log {} deleted from machine {}", logId, machineId);
    }

    // ─────────────────────── helpers ───────────────────────

    private Machine ensureMachineAccess(Long machineId, Long userId) {
        ProviderProfile provider = providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ForbiddenException(ERR_PROVIDER_NOT_FOUND));
        return machineRepository.findByIdAndProviderId(machineId, provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException(ERR_MACHINE_NOT_FOUND));
    }

    private MachineMaintenanceLogResponse toResponse(MachineMaintenanceLog entry) {
        return MachineMaintenanceLogMapper.toResponse(entry, displayNameOf(entry.getCreatedBy()));
    }

    private String displayNameOf(User user) {
        return clientProfileRepository.findByUserId(user.getId())
                .map(ClientProfile::getName)
                .orElseGet(() -> providerProfileRepository.findByUserId(user.getId())
                        .map(ProviderProfile::getCompanyName)
                        .orElse(user.getEmail()));
    }
}
