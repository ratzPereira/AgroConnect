package com.agroconnect.repository;

import com.agroconnect.model.ExecutionPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExecutionPhotoRepository extends JpaRepository<ExecutionPhoto, Long> {

    List<ExecutionPhoto> findByExecutionId(Long executionId);

    int countByExecutionId(Long executionId);
}
