package com.agroconnect.dto.request;

import com.agroconnect.model.enums.PricingModel;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Schema(description = "Request to create a proposal for a service request")
public record CreateProposalDto(

        @NotNull(message = "O preço é obrigatório")
        @Positive(message = "O preço deve ser positivo")
        @Schema(description = "Total price", example = "250.00")
        BigDecimal price,

        @Schema(description = "Pricing model", example = "FIXED")
        PricingModel pricingModel,

        @Positive(message = "O preço unitário deve ser positivo")
        @Schema(description = "Unit price (for PER_UNIT pricing)", example = "125.00")
        BigDecimal unitPrice,

        @Positive(message = "As unidades estimadas devem ser positivas")
        @Schema(description = "Estimated units (for PER_UNIT pricing)", example = "2.0")
        Double estimatedUnits,

        @NotBlank(message = "A descrição é obrigatória")
        @Schema(description = "Description of the proposal", example = "Realizo a lavoura com trator de 120cv com grade de discos")
        String description,

        @Schema(description = "What is included", example = "Combustível, operador, transporte do equipamento")
        String includesText,

        @Schema(description = "What is excluded", example = "Trabalhos de drenagem, remoção de pedras")
        String excludesText,

        @Schema(description = "Estimated completion date", example = "2026-04-10")
        LocalDate estimatedDate,

        @Schema(description = "Proposal valid until", example = "2026-04-01T00:00:00Z")
        Instant validUntil
) {}
