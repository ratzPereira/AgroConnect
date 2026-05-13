package com.agroconnect.dto.request;

import com.agroconnect.model.enums.MaintenanceType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

@Schema(description = "Create a maintenance log entry for a machine.")
public record CreateMaintenanceLogDto(

        @NotNull
        @Schema(description = "Type of maintenance performed", example = "ROUTINE")
        MaintenanceType maintenanceType,

        @NotBlank
        @Size(max = 500)
        @Schema(description = "Free-text description of the work performed", example = "Mudança de óleo e filtros")
        String description,

        @DecimalMin("0.0")
        @Digits(integer = 8, fraction = 2)
        @Schema(description = "Total cost of the work in EUR (optional)", example = "120.00")
        BigDecimal cost,

        @Size(max = 255)
        @Schema(description = "Workshop or technician name", example = "Oficina Silva")
        String workshopName,

        @NotNull
        @Schema(description = "Date the work was performed", example = "2026-05-10")
        LocalDate performedAt,

        @Schema(description = "Optional date when the next maintenance is due", example = "2026-11-10")
        LocalDate nextDueAt,

        @Size(max = 5000)
        @Schema(description = "Free-text notes (parts replaced, observations)")
        String notes
) {}
