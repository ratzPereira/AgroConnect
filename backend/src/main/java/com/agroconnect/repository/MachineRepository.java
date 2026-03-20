package com.agroconnect.repository;

import com.agroconnect.model.Machine;
import com.agroconnect.model.enums.MachineStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MachineRepository extends JpaRepository<Machine, Long> {

    List<Machine> findByProviderIdAndStatus(Long providerId, MachineStatus status);

    Optional<Machine> findByIdAndProviderId(Long id, Long providerId);
}
