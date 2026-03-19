package com.agroconnect.service;

import com.agroconnect.dto.response.CategoryResponse;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.mapper.CategoryMapper;
import com.agroconnect.model.ServiceCategory;
import com.agroconnect.repository.ServiceCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final ServiceCategoryRepository categoryRepository;

    public List<CategoryResponse> listAll() {
        return categoryRepository.findAllByActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(CategoryMapper::toResponse)
                .toList();
    }

    public CategoryResponse findById(Long id) {
        ServiceCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada com ID: " + id));
        return CategoryMapper.toResponse(category);
    }
}
