package com.agroconnect.controller;

import com.agroconnect.dto.response.CategoryResponse;
import com.agroconnect.exception.GlobalExceptionHandler.ErrorResponse;
import com.agroconnect.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/v1/categories")
@RequiredArgsConstructor
@Tag(name = "Service Categories", description = "Browse available service categories")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "List all service categories", description = "Returns all active service categories ordered by sort order")
    @ApiResponse(responseCode = "200", description = "List of service categories")
    public ResponseEntity<List<CategoryResponse>> listAll() {
        List<CategoryResponse> categories = categoryService.listAll();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get category by ID", description = "Returns a single service category by its ID")
    @ApiResponse(responseCode = "200", description = "Category found")
    @ApiResponse(responseCode = "404", description = "Category not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<CategoryResponse> findById(
            @Parameter(description = "Category ID") @PathVariable Long id) {
        CategoryResponse category = categoryService.findById(id);
        return ResponseEntity.ok(category);
    }
}
