package com.agroconnect.service;

import com.agroconnect.dto.response.OperatorAnalyticsResponse;
import com.agroconnect.dto.response.OperatorAnalyticsResponse.OperatorTopMachineEntry;
import com.agroconnect.dto.response.OperatorJobResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.ExecutionAssignment;
import com.agroconnect.model.Machine;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.ServiceExecution;
import com.agroconnect.model.TeamMember;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.ExecutionAssignmentRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.ServiceExecutionRepository;
import com.agroconnect.repository.TeamMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Read-only aggregations for the per-operator deep view. Derives jobs done,
 * hours worked, labor cost, attributed revenue, profit and top machines used
 * over an arbitrary period.
 *
 * Revenue attribution is *equal-split per operator*: when an execution has
 * N operators assigned, each is credited proposal.price / N. The trade-off
 * (revenue cannot be summed across operators to get business revenue without
 * de-duplication, but per-operator profit is comparable) is documented in
 * the design doc; this differs from machine attribution (which uses full).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeamAnalyticsService {

    private static final String ERR_OPERATOR_NOT_FOUND = "Membro de equipa não encontrado.";
    private static final String ERR_PROVIDER_NOT_FOUND = "Perfil de prestador não encontrado.";

    private static final MathContext MC = MathContext.DECIMAL64;
    private static final int CURRENCY_SCALE = 2;
    private static final int HOURS_SCALE = 2;
    private static final int TOP_MACHINES_LIMIT = 5;

    private final TeamMemberRepository teamMemberRepository;
    private final ExecutionAssignmentRepository assignmentRepository;
    private final ServiceExecutionRepository executionRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final ClientProfileRepository clientProfileRepository;

    public OperatorAnalyticsResponse getAnalytics(Long operatorId, Long userId, LocalDate from, LocalDate to) {
        TeamMember operator = loadOperatorForUser(operatorId, userId);
        LocalDate[] range = normalizeRange(from, to);
        var fromInstant = range[0].atStartOfDay().toInstant(ZoneOffset.UTC);
        var toInstantExcl = range[1].plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);

        long jobsDone = assignmentRepository.countDistinctExecutionsForOperator(operatorId, fromInstant, toInstantExcl);
        BigDecimal hoursWorked = nz(assignmentRepository.sumHoursWorkedForOperator(operatorId, fromInstant, toInstantExcl))
                .setScale(HOURS_SCALE, RoundingMode.HALF_UP);
        BigDecimal laborCost = nz(assignmentRepository.sumLaborCostForOperator(operatorId, fromInstant, toInstantExcl))
                .setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);

        List<ExecutionAssignment> assignments = assignmentRepository.findAllForOperatorInPeriod(operatorId, fromInstant, toInstantExcl);

        BigDecimal revenue = computeAttributedRevenue(assignments).setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);
        BigDecimal profit = revenue.subtract(laborCost, MC).setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);

        BigDecimal profitPerHour = hoursWorked.signum() == 0
                ? BigDecimal.ZERO.setScale(CURRENCY_SCALE, RoundingMode.HALF_UP)
                : profit.divide(hoursWorked, MC).setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);
        BigDecimal profitPerJob = jobsDone == 0
                ? BigDecimal.ZERO.setScale(CURRENCY_SCALE, RoundingMode.HALF_UP)
                : profit.divide(BigDecimal.valueOf(jobsDone), MC).setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);

        List<OperatorTopMachineEntry> topMachines = computeTopMachines(assignments);

        return new OperatorAnalyticsResponse(
                operator.getId(),
                operator.getName(),
                range[0],
                range[1],
                jobsDone,
                hoursWorked,
                laborCost,
                revenue,
                profit,
                profitPerHour,
                profitPerJob,
                topMachines
        );
    }

    public Page<OperatorJobResponse> listJobs(Long operatorId, Long userId,
                                              LocalDate from, LocalDate to,
                                              Pageable pageable) {
        loadOperatorForUser(operatorId, userId);
        LocalDate[] range = normalizeRange(from, to);
        var fromInstant = range[0].atStartOfDay().toInstant(ZoneOffset.UTC);
        var toInstantExcl = range[1].plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);

        Page<Long> executionIds = assignmentRepository.findExecutionIdsForOperator(operatorId, fromInstant, toInstantExcl, pageable);
        if (executionIds.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, executionIds.getTotalElements());
        }

        List<ServiceExecution> executions = executionRepository.findAllById(executionIds.getContent());
        List<OperatorJobResponse> content = executionIds.getContent().stream()
                .map(id -> findExecution(executions, id))
                .filter(java.util.Objects::nonNull)
                .map(exec -> toJobResponse(exec, operatorId))
                .toList();

        return new PageImpl<>(content, pageable, executionIds.getTotalElements());
    }

    // ─────────────────────── helpers ───────────────────────

    private BigDecimal computeAttributedRevenue(List<ExecutionAssignment> assignments) {
        BigDecimal total = BigDecimal.ZERO;
        Map<Long, BigDecimal> perExecution = new HashMap<>();
        for (ExecutionAssignment a : assignments) {
            Long execId = a.getExecution().getId();
            if (perExecution.containsKey(execId)) {
                continue;
            }
            BigDecimal price = a.getExecution().getProposal() != null
                    ? nz(a.getExecution().getProposal().getPrice())
                    : BigDecimal.ZERO;
            long operatorsCount = assignmentRepository.countOperatorsForExecution(execId);
            BigDecimal share = operatorsCount <= 0
                    ? price
                    : price.divide(BigDecimal.valueOf(operatorsCount), MC);
            perExecution.put(execId, share);
            total = total.add(share, MC);
        }
        return total;
    }

    private List<OperatorTopMachineEntry> computeTopMachines(List<ExecutionAssignment> assignments) {
        Map<Long, MachineStats> stats = new HashMap<>();
        for (ExecutionAssignment a : assignments) {
            Machine m = a.getMachine();
            if (m == null) continue;
            MachineStats s = stats.computeIfAbsent(m.getId(), k -> new MachineStats(m.getName()));
            s.jobs += 1;
            s.hours = s.hours.add(nz(a.getMachineHours()));
        }
        return stats.entrySet().stream()
                .map(e -> new OperatorTopMachineEntry(
                        e.getKey(),
                        e.getValue().name,
                        e.getValue().jobs,
                        e.getValue().hours.setScale(HOURS_SCALE, RoundingMode.HALF_UP)))
                .sorted(Comparator.comparingLong(OperatorTopMachineEntry::jobsCount).reversed())
                .limit(TOP_MACHINES_LIMIT)
                .toList();
    }

    private OperatorJobResponse toJobResponse(ServiceExecution exec, Long operatorId) {
        ExecutionAssignment operatorAssignment = exec.getAssignments().stream()
                .filter(a -> a.getTeamMember() != null && operatorId.equals(a.getTeamMember().getId()))
                .findFirst()
                .orElse(null);

        BigDecimal hours = operatorAssignment != null
                ? nz(operatorAssignment.getHoursWorked()).setScale(HOURS_SCALE, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(HOURS_SCALE, RoundingMode.HALF_UP);
        BigDecimal rate = operatorAssignment != null && operatorAssignment.getHourlyRateSnapshot() != null
                ? operatorAssignment.getHourlyRateSnapshot().setScale(CURRENCY_SCALE, RoundingMode.HALF_UP)
                : null;
        BigDecimal labor = rate != null
                ? hours.multiply(rate, MC).setScale(CURRENCY_SCALE, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);

        BigDecimal price = exec.getProposal() != null
                ? nz(exec.getProposal().getPrice())
                : BigDecimal.ZERO;
        long operatorsCount = assignmentRepository.countOperatorsForExecution(exec.getId());
        BigDecimal revShare = operatorsCount <= 0
                ? price
                : price.divide(BigDecimal.valueOf(operatorsCount), MC);
        BigDecimal revenueAttributed = revShare.setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);

        Long requestId = exec.getProposal() != null && exec.getProposal().getRequest() != null
                ? exec.getProposal().getRequest().getId()
                : null;
        String clientName = exec.getProposal() != null && exec.getProposal().getRequest() != null
                ? resolveClientName(exec.getProposal().getRequest().getClient().getId())
                : null;
        String machineName = operatorAssignment != null && operatorAssignment.getMachine() != null
                ? operatorAssignment.getMachine().getName()
                : null;

        return new OperatorJobResponse(
                exec.getId(),
                requestId,
                clientName,
                hours,
                rate,
                labor,
                revenueAttributed,
                machineName,
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

    private TeamMember loadOperatorForUser(Long operatorId, Long userId) {
        ProviderProfile provider = providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ForbiddenException(ERR_PROVIDER_NOT_FOUND));
        return teamMemberRepository.findByIdAndProviderId(operatorId, provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException(ERR_OPERATOR_NOT_FOUND));
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

    private static BigDecimal nz(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    private static class MachineStats {
        final String name;
        long jobs = 0;
        BigDecimal hours = BigDecimal.ZERO;

        MachineStats(String name) {
            this.name = name;
        }
    }
}
