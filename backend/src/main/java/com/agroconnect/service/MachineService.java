package com.agroconnect.service;

import com.agroconnect.dto.request.CreateMachineDto;
import com.agroconnect.dto.request.UpdateMachineDto;
import com.agroconnect.dto.response.MachineResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.mapper.MachineMapper;
import com.agroconnect.model.Machine;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.enums.MachineStatus;
import com.agroconnect.repository.MachineRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MachineService {

    private static final Logger log = LoggerFactory.getLogger(MachineService.class);

    private final MachineRepository machineRepository;
    private final ProviderProfileRepository providerProfileRepository;

    public List<MachineResponse> listByProvider(Long userId) {
        ProviderProfile provider = getProviderProfile(userId);
        return machineRepository.findByProviderId(provider.getId()).stream()
                .map(MachineMapper::toResponse)
                .toList();
    }

    public List<MachineResponse> listByProviderAndStatus(Long userId, MachineStatus status) {
        ProviderProfile provider = getProviderProfile(userId);
        return machineRepository.findByProviderIdAndStatus(provider.getId(), status).stream()
                .map(MachineMapper::toResponse)
                .toList();
    }

    public MachineResponse getById(Long id, Long userId) {
        ProviderProfile provider = getProviderProfile(userId);
        Machine machine = machineRepository.findByIdAndProviderId(id, provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Máquina não encontrada."));
        return MachineMapper.toResponse(machine);
    }

    @Transactional
    public MachineResponse create(CreateMachineDto dto, Long userId) {
        ProviderProfile provider = getProviderProfile(userId);

        Machine machine = Machine.builder()
                .provider(provider)
                .name(dto.name())
                .type(dto.type())
                .description(dto.description())
                .licensePlate(dto.licensePlate())
                .nextMaintenanceDate(dto.nextMaintenanceDate())
                .status(MachineStatus.AVAILABLE)
                .build();

        machine = machineRepository.save(machine);
        log.info("Machine {} created for provider {}", machine.getId(), provider.getId());
        return MachineMapper.toResponse(machine);
    }

    @Transactional
    public MachineResponse update(Long id, UpdateMachineDto dto, Long userId) {
        ProviderProfile provider = getProviderProfile(userId);
        Machine machine = machineRepository.findByIdAndProviderId(id, provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Máquina não encontrada."));

        machine.setName(dto.name());
        machine.setType(dto.type());
        machine.setDescription(dto.description());
        machine.setLicensePlate(dto.licensePlate());
        machine.setLastMaintenanceDate(dto.lastMaintenanceDate());
        machine.setNextMaintenanceDate(dto.nextMaintenanceDate());
        if (dto.status() != null) {
            machine.setStatus(dto.status());
        }

        machine = machineRepository.save(machine);
        log.info("Machine {} updated", machine.getId());
        return MachineMapper.toResponse(machine);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        ProviderProfile provider = getProviderProfile(userId);
        Machine machine = machineRepository.findByIdAndProviderId(id, provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Máquina não encontrada."));

        if (machine.getStatus() != MachineStatus.RETIRED) {
            throw new InvalidStateException("Só é possível eliminar máquinas com estado RETIRED.");
        }

        machineRepository.delete(machine);
        log.info("Machine {} deleted", id);
    }

    private ProviderProfile getProviderProfile(Long userId) {
        return providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ForbiddenException("Perfil de prestador não encontrado."));
    }
}
