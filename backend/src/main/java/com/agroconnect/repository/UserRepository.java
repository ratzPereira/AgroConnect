package com.agroconnect.repository;

import com.agroconnect.model.User;
import com.agroconnect.model.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    long countByRole(Role role);

    long countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(Instant start, Instant end);

    Page<User> findByRoleOrderByCreatedAtDesc(Role role, Pageable pageable);

    Page<User> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
