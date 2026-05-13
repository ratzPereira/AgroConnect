package com.agroconnect.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;

import java.math.BigDecimal;

@Schema(description = "Payload to update labor / machine hours on an assignment")
public record UpdateAssignmentHoursDto(

        @Schema(description = "Hours worked by the operator (null clears)", example = "8.00")
        @DecimalMin(value = "0.00", message = "As horas trabalhadas não podem ser negativas.")
        @Digits(integer = 4, fraction = 2)
        BigDecimal hoursWorked,

        @Schema(description = "Machine usage hours (null clears)", example = "6.50")
        @DecimalMin(value = "0.00", message = "As horas de máquina não podem ser negativas.")
        @Digits(integer = 4, fraction = 2)
        BigDecimal machineHours
) {}
