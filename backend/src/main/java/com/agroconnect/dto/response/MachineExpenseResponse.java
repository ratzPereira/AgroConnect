package com.agroconnect.dto.response;

import com.agroconnect.model.enums.ExpenseCategory;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Schema(description = "A single operating expense entry for a machine.")
public record MachineExpenseResponse(

        @Schema(description = "Expense ID") Long id,
        @Schema(description = "Machine ID") Long machineId,
        @Schema(description = "Expense category") ExpenseCategory category,
        @Schema(description = "Description (nullable)") String description,
        @Schema(description = "Amount in EUR") BigDecimal amount,
        @Schema(description = "Date the expense was incurred") LocalDate incurredAt,
        @Schema(description = "Free-text notes (nullable)") String notes,
        @Schema(description = "ID of the user who recorded the entry") Long createdById,
        @Schema(description = "Display name of the user who recorded the entry") String createdByName,
        @Schema(description = "When the entry was recorded") Instant createdAt
) {}
