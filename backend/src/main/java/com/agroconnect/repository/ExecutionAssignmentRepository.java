package com.agroconnect.repository;

import com.agroconnect.model.ExecutionAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExecutionAssignmentRepository extends JpaRepository<ExecutionAssignment, Long> {

    List<ExecutionAssignment> findByExecutionId(Long executionId);

    boolean existsByExecutionIdAndTeamMemberId(Long executionId, Long teamMemberId);
}
