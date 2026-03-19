package com.agroconnect.unit;

import com.agroconnect.dto.response.CategoryResponse;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.model.ServiceCategory;
import com.agroconnect.repository.ServiceCategoryRepository;
import com.agroconnect.service.CategoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private ServiceCategoryRepository categoryRepository;

    private CategoryService categoryService;

    @BeforeEach
    void setUp() {
        categoryService = new CategoryService(categoryRepository);
    }

    @Test
    void listAll_shouldReturnAllActiveCategories() {
        ServiceCategory cat1 = ServiceCategory.builder()
                .id(1L).name("Preparação de Solo").slug("preparacao-solo")
                .description("Lavrar e gradar terrenos").pricingModels(List.of("FIXED", "PER_UNIT"))
                .active(true).sortOrder(1).build();
        ServiceCategory cat2 = ServiceCategory.builder()
                .id(2L).name("Fitossanitários").slug("fitossanitarios")
                .description("Aplicação de produtos").pricingModels(List.of("PER_UNIT"))
                .active(true).sortOrder(2).build();

        when(categoryRepository.findAllByActiveTrueOrderBySortOrderAsc()).thenReturn(List.of(cat1, cat2));

        List<CategoryResponse> result = categoryService.listAll();

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Preparação de Solo", result.get(0).name());
        assertEquals("Fitossanitários", result.get(1).name());
    }

    @Test
    void findById_givenExistingId_shouldReturnCategory() {
        ServiceCategory category = ServiceCategory.builder()
                .id(1L).name("Preparação de Solo").slug("preparacao-solo")
                .description("Lavrar").pricingModels(List.of("FIXED"))
                .active(true).sortOrder(1).build();

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));

        CategoryResponse result = categoryService.findById(1L);

        assertNotNull(result);
        assertEquals(1L, result.id());
        assertEquals("Preparação de Solo", result.name());
    }

    @Test
    void findById_givenNonExistentId_shouldThrowResourceNotFound() {
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> categoryService.findById(99L));
    }
}
