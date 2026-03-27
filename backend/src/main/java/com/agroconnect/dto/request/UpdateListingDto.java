package com.agroconnect.dto.request;

import com.agroconnect.model.enums.ListingCategory;
import com.agroconnect.model.enums.ListingCondition;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@Schema(description = "Update an existing marketplace listing (all fields optional)")
public record UpdateListingDto(

        @Size(max = 200, message = "O título não pode exceder 200 caracteres.")
        @Schema(description = "Listing title")
        String title,

        @Schema(description = "Detailed description of the item")
        String description,

        @PositiveOrZero(message = "O preço deve ser zero ou positivo.")
        @Schema(description = "Price in EUR (null means price on request)")
        BigDecimal price,

        @Schema(description = "Whether the price is negotiable")
        Boolean priceNegotiable,

        @Schema(description = "Listing category")
        ListingCategory category,

        @Schema(description = "Item condition")
        ListingCondition condition,

        @PositiveOrZero(message = "A quantidade deve ser zero ou positiva.")
        @Schema(description = "Quantity available")
        BigDecimal quantity,

        @Size(max = 30, message = "A unidade não pode exceder 30 caracteres.")
        @Schema(description = "Unit of measure")
        String unit,

        @Schema(description = "Location latitude")
        Double latitude,

        @Schema(description = "Location longitude")
        Double longitude,

        @Size(max = 200, message = "O nome da localização não pode exceder 200 caracteres.")
        @Schema(description = "Human-readable location name")
        String locationName,

        @Size(max = 100, message = "A freguesia não pode exceder 100 caracteres.")
        @Schema(description = "Parish name")
        String parish,

        @Size(max = 100, message = "O município não pode exceder 100 caracteres.")
        @Schema(description = "Municipality name")
        String municipality,

        @Size(max = 50, message = "A ilha não pode exceder 50 caracteres.")
        @Schema(description = "Island name")
        String island
) {}
