package com.agroconnect.mapper;

import com.agroconnect.dto.response.CategoryResponse;
import com.agroconnect.model.ServiceCategory;

public final class CategoryMapper {

    private CategoryMapper() {}

    public static CategoryResponse toResponse(ServiceCategory category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getDescription(),
                category.getIconUrl(),
                category.getPricingModels()
        );
    }
}
