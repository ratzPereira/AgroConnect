package com.agroconnect.repository;

import com.agroconnect.model.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {

    List<TeamMember> findByProviderIdAndActiveTrue(Long providerId);

    Optional<TeamMember> findByIdAndProviderId(Long id, Long providerId);

    boolean existsByProviderIdAndEmail(Long providerId, String email);
}
