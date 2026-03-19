package com.agroconnect.repository;

import com.agroconnect.model.ProviderService;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProviderServiceRepository extends JpaRepository<ProviderService, Long> {

    List<ProviderService> findByProviderId(Long providerId);
}
