package com.agroconnect.service;

import com.agroconnect.dto.response.MachineAnalyticsResponse;
import com.agroconnect.dto.response.MachineJobResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.ExecutionAssignment;
import com.agroconnect.model.Machine;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.ServiceExecution;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.ExecutionAssignmentRepository;
import com.agroconnect.repository.MachineExpenseRepository;
import com.agroconnect.repository.MachineMaintenanceLogRepository;
import com.agroconnect.repository.MachineRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.ServiceExecutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Read-only aggregations for the per-machine deep view. Derives jobs done,
 * machine hours, revenue contributed, utilization, maintenance cost, and
 * operating-expense totals over an arbitrary period.
 *
 * Revenue attribution is *full per machine* — if multiple machines work on
 * the same execution, each is credited the full proposal price. The trade-off
 * (revenue can sum higher than total business revenue) is documented in the
 * design doc; the alternative (split by share of machine hours) would require
 * a per-execution allocation column we did not want to introduce.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MachineAnalyticsService {

    private static final String ERR_MACHINE_NOT_FOUND = "Máquina não encontrada.";
    private static final String ERR_PROVIDER_NOT_FOUND = "Perfil de prestador não encontrado.";

    private static final MathContext MC = MathContext.DECIMAL64;
    private static final int CURRENCY_SCALE = 2;
    private static final int PERCENT_SCALE = 1;
    private static final BigDecimal HOURS_PER_DAY = new BigDecimal("8");
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");

    private final MachineRepository machineRepository;
    private final MachineMaintenanceLogRepository maintenanceRepository;
    private final MachineExpenseRepository expenseRepository;
    private final ExecutionAssignmentRepository assignmentRepository;
    private final ServiceExecutionRepository executionRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final ClientProfileRepository clientProfileRepository;

    public MachineAnalyticsResponse getAnalytics(Long machineId, Long userId, LocalDate from, LocalDate to) {
        Machine machine = loadMachineForUser(machineId, userId);
        LocalDate[] range = normalizeRange(from, to);
        LocalDate rangeFrom = range[0];
        LocalDate rangeTo = range[1];

        var fromInstant = rangeFrom.atStartOfDay().toInstant(ZoneOffset.UTC);
        var toInstantExclusive = rangeTo.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);

        long jobsDone = assignmentRepository.countDistinctExecutionsForMachine(machineId, fromInstant, toInstantExclusive);
        BigDecimal machineHours = nz(assignmentRepository.sumMachineHoursInPeriod(machineId, fromInstant, toInstantExclusive))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal revenue = nz(assignmentRepository.sumRevenueAttributedToMachine(machineId, fromInstant, toInstantExclusive))
                .setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);
        BigDecimal maintenanceCost = nz(maintenanceRepository.sumCostInPeriod(machineId, rangeFrom, rangeTo))
                .setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);
        BigDecimal expensesCost = nz(expenseRepository.sumAmountInPeriod(machineId, rangeFrom, rangeTo))
                .setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);

        BigDecimal netContribution = revenue.subtract(maintenanceCost, MC).subtract(expensesCost, MC)
                .setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);

        BigDecimal utilization = computeUtilization(machineHours, rangeFrom, rangeTo);
        long maintenanceCount = maintenanceRepository.countInPeriod(machineId, rangeFrom, rangeTo);

        return new MachineAnalyticsResponse(
                machine.getId(),
                machine.getName(),
                rangeFrom,
                rangeTo,
                jobsDone,
                machineHours,
                utilization,
                revenue,
                maintenanceCost,
                expensesCost,
                netContribution,
                maintenanceCount,
                machine.getLastMaintenanceDate(),
                machine.getNextMaintenanceDate()
        );
    }

    public Page<MachineJobResponse> listJobs(Long machineId, Long userId,
                                             LocalDate from, LocalDate to,
                                             Pageable pageable) {
        loadMachineForUser(machineId, userId);
        LocalDate[] range = normalizeRange(from, to);
        var fromInstant = range[0].atStartOfDay().toInstant(ZoneOffset.UTC);
        var toInstantExclusive = range[1].plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);

        Page<Long> executionIds = assignmentRepository.findExecutionIdsForMachine(
                machineId, fromInstant, toInstantExclusive, pageable);

        if (executionIds.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, executionIds.getTotalElements());
        }

        List<ServiceExecution> executions = executionRepository.findAllById(executionIds.getContent());
        List<MachineJobResponse> content = executionIds.getContent().stream()
                .map(id -> findExecution(executions, id))
                .filter(java.util.Objects::nonNull)
                .map(exec -> toJobResponse(exec, machineId))
                .toList();

        return new PageImpl<>(content, pageable, executionIds.getTotalElements());
    }

    // ─────────────────────── helpers ───────────────────────

    private MachineJobResponse toJobResponse(ServiceExecution exec, Long machineId) {
        BigDecimal revenue = exec.getProposal() != null && exec.getProposal().getPrice() != null
                ? exec.getProposal().getPrice().setScale(CURRENCY_SCALE, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);

        BigDecimal hours = exec.getAssignments().stream()
                .filter(a -> a.getMachine() != null && machineId.equals(a.getMachine().getId()))
                .map(ExecutionAssignment::getMachineHours)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        Long requestId = exec.getProposal() != null && exec.getProposal().getRequest() != null
                ? exec.getProposal().getRequest().getId()
                : null;

        String clientName = exec.getProposal() != null && exec.getProposal().getRequest() != null
                ? resolveClientName(exec.getProposal().getRequest().getClient().getId())
                : null;

        return new MachineJobResponse(
                exec.getId(),
                requestId,
                clientName,
                revenue,
                hours,
                exec.getCompletedAt()
        );
    }

    private ServiceExecution findExecution(List<ServiceExecution> list, Long id) {
        for (ServiceExecution e : list) {
            if (e.getId().equals(id)) {
                return e;
            }
        }
        return null;
    }

    private String resolveClientName(Long userId) {
        return clientProfileRepository.findByUserId(userId)
                .map(ClientProfile::getName)
                .orElse(null);
    }

    private Machine loadMachineForUser(Long machineId, Long userId) {
        ProviderProfile provider = providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ForbiddenException(ERR_PROVIDER_NOT_FOUND));
        return machineRepository.findByIdAndProviderId(machineId, provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException(ERR_MACHINE_NOT_FOUND));
    }

    private LocalDate[] normalizeRange(LocalDate from, LocalDate to) {
        LocalDate today = LocalDate.now();
        LocalDate effectiveTo = to != null ? to : today;
        LocalDate effectiveFrom = from != null ? from : effectiveTo.withDayOfYear(1);
        if (effectiveFrom.isAfter(effectiveTo)) {
            LocalDate swap = effectiveFrom;
            effectiveFrom = effectiveTo;
            effectiveTo = swap;
        }
        return new LocalDate[]{effectiveFrom, effectiveTo};
    }

    private BigDecimal computeUtilization(BigDecimal machineHours, LocalDate from, LocalDate to) {
        long days = ChronoUnit.DAYS.between(from, to) + 1;
        if (days <= 0) {
            return BigDecimal.ZERO.setScale(PERCENT_SCALE, RoundingMode.HALF_UP);
        }
        BigDecimal workingHours = HOURS_PER_DAY.multiply(BigDecimal.valueOf(days));
        if (workingHours.signum() == 0) {
            return BigDecimal.ZERO.setScale(PERCENT_SCALE, RoundingMode.HALF_UP);
        }
        return machineHours.multiply(ONE_HUNDRED, MC)
                .divide(workingHours, MC)
                .setScale(PERCENT_SCALE, RoundingMode.HALF_UP);
    }

    private static BigDecimal nz(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
