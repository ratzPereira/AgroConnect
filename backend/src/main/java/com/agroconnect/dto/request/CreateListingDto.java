package com.agroconnect.dto.request;

import com.agroconnect.model.enums.ListingCategory;
import com.agroconnect.model.enums.ListingCondition;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@Schema(description = "Create a new marketplace listing")
public record CreateListingDto(

        @NotBlank(message = "O título é obrigatório.")
        @Size(max = 200, message = "O título não pode exceder 200 caracteres.")
        @Schema(description = "Listing title", example = "Vitelos Holstein — 6 meses")
        String title,

        @NotBlank(message = "A descrição é obrigatória.")
        @Schema(description = "Detailed description of the item", example = "Vendo 3 vitelos Holstein com 6 meses, vacinados e desparasitados.")
        String description,

        @PositiveOrZero(message = "O preço deve ser zero ou positivo.")
        @Schema(description = "Price in EUR (null means price on request)", example = "1500.00")
        BigDecimal price,

        @Schema(description = "Whether the price is negotiable", example = "true")
        boolean priceNegotiable,

        @NotNull(message = "A categoria é obrigatória.")
        @Schema(description = "Listing category", example = "ANIMALS")
        ListingCategory category,

        @Schema(description = "Item condition (null if not applicable)", example = "USED")
        ListingCondition condition,

        @PositiveOrZero(message = "A quantidade deve ser zero ou positiva.")
        @Schema(description = "Quantity available", example = "3")
        BigDecimal quantity,

        @Size(max = 30, message = "A unidade não pode exceder 30 caracteres.")
        @Schema(description = "Unit of measure", example = "cabeças")
        String unit,

        @NotNull(message = "A latitude é obrigatória.")
        @Schema(description = "Location latitude", example = "38.7167")
        Double latitude,

        @NotNull(message = "A longitude é obrigatória.")
        @Schema(description = "Location longitude", example = "-27.2167")
        Double longitude,

        @Size(max = 200, message = "O nome da localização não pode exceder 200 caracteres.")
        @Schema(description = "Human-readable location name", example = "Angra do Heroísmo")
        String locationName,

        @Size(max = 100, message = "A freguesia não pode exceder 100 caracteres.")
        @Schema(description = "Parish name", example = "Sé")
        String parish,

        @Size(max = 100, message = "O município não pode exceder 100 caracteres.")
        @Schema(description = "Municipality name", example = "Angra do Heroísmo")
        String municipality,

        @NotBlank(message = "A ilha é obrigatória.")
        @Size(max = 50, message = "A ilha não pode exceder 50 caracteres.")
        @Schema(description = "Island name", example = "Terceira")
        String island
) {}
