package com.agroconnect.repository;

import com.agroconnect.model.ServiceCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceCategoryRepository extends JpaRepository<ServiceCategory, Long> {

    List<ServiceCategory> findAllByActiveTrueOrderBySortOrderAsc();
}
