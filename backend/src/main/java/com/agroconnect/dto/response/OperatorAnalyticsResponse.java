package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Schema(description = "Aggregated operating analytics for a team operator over a period [from, to].")
public record OperatorAnalyticsResponse(

        @Schema(description = "Operator (team member) ID") Long operatorId,
        @Schema(description = "Operator full name (denormalized for convenience)") String operatorName,

        @Schema(description = "Inclusive start of the period") LocalDate from,
        @Schema(description = "Inclusive end of the period") LocalDate to,

        @Schema(description = "Number of distinct completed jobs the operator appeared on") long jobsDone,
        @Schema(description = "Sum of hours_worked across those jobs") BigDecimal hoursWorked,

        @Schema(description = "Labor cost generated = SUM(hours_worked × hourly_rate_snapshot)") BigDecimal laborCost,
        @Schema(description = "Revenue attributed (proposal.price / number of operators on that execution)") BigDecimal revenueAttributed,
        @Schema(description = "Profit = revenueAttributed − laborCost") BigDecimal profit,
        @Schema(description = "Profit per hour = profit / hoursWorked (zero if no hours)") BigDecimal profitPerHour,
        @Schema(description = "Profit per job = profit / jobsDone (zero if no jobs)") BigDecimal profitPerJob,

        @Schema(description = "Top machines used by this operator, ordered by jobs count desc, capped to 5") List<OperatorTopMachineEntry> topMachines
) {

    @Schema(description = "Top-N machine usage entry for an operator")
    public record OperatorTopMachineEntry(
            @Schema(description = "Machine ID") Long machineId,
            @Schema(description = "Machine name") String machineName,
            @Schema(description = "Number of distinct jobs the operator used this machine on") long jobsCount,
            @Schema(description = "Sum of machine_hours operator logged on this machine") BigDecimal machineHours
    ) {}
}
