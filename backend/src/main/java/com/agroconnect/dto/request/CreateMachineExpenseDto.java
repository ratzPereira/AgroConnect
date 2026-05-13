package com.agroconnect.dto.request;

import com.agroconnect.model.enums.ExpenseCategory;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

@Schema(description = "Record an operating expense for a machine.")
public record CreateMachineExpenseDto(

        @NotNull
        @Schema(description = "Expense category", example = "FUEL")
        ExpenseCategory category,

        @Size(max = 255)
        @Schema(description = "Short description of the expense", example = "Reabastecimento de gasóleo")
        String description,

        @NotNull
        @Positive
        @Digits(integer = 8, fraction = 2)
        @Schema(description = "Amount in EUR (must be positive)", example = "55.30")
        BigDecimal amount,

        @NotNull
        @Schema(description = "Date the expense was incurred", example = "2026-05-12")
        LocalDate incurredAt,

        @Size(max = 5000)
        @Schema(description = "Free-text notes")
        String notes
) {}
