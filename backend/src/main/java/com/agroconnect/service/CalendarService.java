package com.agroconnect.service;

import com.agroconnect.dto.request.ReassignExecutionDto;
import com.agroconnect.dto.request.ScheduleUpdateDto;
import com.agroconnect.dto.response.CalendarAlertsResponse;
import com.agroconnect.dto.response.CalendarAlertsResponse.ConflictAlert;
import com.agroconnect.dto.response.CalendarAlertsResponse.MaintenanceAlert;
import com.agroconnect.dto.response.CalendarAlertsResponse.PaymentAlert;
import com.agroconnect.dto.response.CalendarAlertsResponse.ProposalAlert;
import com.agroconnect.dto.response.CalendarEventResponse;
import com.agroconnect.dto.response.CalendarEventResponse.CalendarAssignment;
import com.agroconnect.dto.response.CalendarSummaryResponse;
import com.agroconnect.dto.response.ConflictResponse;
import com.agroconnect.dto.response.ConflictResponse.ConflictingEvent;
import com.agroconnect.dto.response.MaintenanceWindowResponse;
import com.agroconnect.dto.response.WorkloadHeatmapResponse;
import com.agroconnect.dto.response.WorkloadHeatmapResponse.OperatorWorkload;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.exception.ValidationException;
import com.agroconnect.model.ExecutionAssignment;
import com.agroconnect.model.Machine;
import com.agroconnect.model.MachineMaintenanceLog;
import com.agroconnect.model.Proposal;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.ServiceExecution;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.TeamMember;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.repository.ExecutionAssignmentRepository;
import com.agroconnect.repository.MachineMaintenanceLogRepository;
import com.agroconnect.repository.MachineRepository;
import com.agroconnect.repository.ProposalRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.ServiceExecutionRepository;
import com.agroconnect.repository.TeamMemberRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CalendarService {

    private static final Logger log = LoggerFactory.getLogger(CalendarService.class);

    private static final LocalTime ALL_DAY_START = LocalTime.of(6, 0);
    private static final LocalTime ALL_DAY_END = LocalTime.of(20, 0);
    private static final int WORK_DAY_MINUTES = (int) Duration.between(ALL_DAY_START, ALL_DAY_END).toMinutes();
    private static final long PAYMENT_SLA_DAYS = 3L;

    private final ServiceExecutionRepository executionRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final ExecutionAssignmentRepository executionAssignmentRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final MachineRepository machineRepository;
    private final MachineMaintenanceLogRepository maintenanceLogRepository;
    private final ProposalRepository proposalRepository;

    public List<CalendarEventResponse> getCalendarEvents(Long userId, LocalDate from, LocalDate to) {
        ProviderProfile provider = getProviderProfile(userId);

        List<ServiceExecution> executions = executionRepository
                .findByProviderAndScheduledRange(provider.getId(), from, to);

        return executions.stream()
                .map(this::toCalendarEvent)
                .toList();
    }

    public List<ConflictResponse> getConflicts(Long userId, LocalDate from, LocalDate to) {
        ProviderProfile provider = getProviderProfile(userId);

        List<ServiceExecution> executions = executionRepository
                .findByProviderAndScheduledRange(provider.getId(), from, to);

        return detectConflicts(executions);
    }

    public CalendarSummaryResponse getCalendarSummary(Long userId, LocalDate from, LocalDate to) {
        ProviderProfile provider = getProviderProfile(userId);

        List<ServiceExecution> executions = executionRepository
                .findByProviderAndScheduledRange(provider.getId(), from, to);

        long total = executions.size();
        long inProgress = countByStatus(executions, RequestStatus.IN_PROGRESS);
        long awaiting = countByStatus(executions, RequestStatus.AWAITING_CONFIRMATION);
        long completed = executions.stream()
                .filter(e -> {
                    RequestStatus s = e.getProposal().getRequest().getStatus();
                    return s == RequestStatus.COMPLETED || s == RequestStatus.RATED;
                })
                .count();

        long conflicting = detectConflicts(executions).stream()
                .flatMap(c -> c.conflictingEvents().stream())
                .map(ConflictingEvent::executionId)
                .distinct()
                .count();

        BigDecimal revenue = executions.stream()
                .map(e -> e.getProposal().getPrice())
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Set<Long> operatorIds = new HashSet<>();
        Set<Long> machineIds = new HashSet<>();
        for (ServiceExecution e : executions) {
            for (ExecutionAssignment a : e.getAssignments()) {
                if (a.getTeamMember() != null) operatorIds.add(a.getTeamMember().getId());
                if (a.getMachine() != null) machineIds.add(a.getMachine().getId());
            }
        }

        BigDecimal utilization = computeUtilization(executions, from, to, provider.getId());

        return new CalendarSummaryResponse(
                total, inProgress, awaiting, completed, conflicting,
                revenue.setScale(2, RoundingMode.HALF_UP),
                operatorIds.size(), machineIds.size(),
                utilization);
    }

    public WorkloadHeatmapResponse getWorkloadHeatmap(Long userId, LocalDate from, LocalDate to) {
        ProviderProfile provider = getProviderProfile(userId);

        List<TeamMember> activeMembers = teamMemberRepository.findByProviderIdAndActiveTrue(provider.getId());
        List<ServiceExecution> executions = executionRepository
                .findByProviderAndScheduledRange(provider.getId(), from, to);

        List<OperatorWorkload> rows = new ArrayList<>();
        for (TeamMember member : activeMembers) {
            Map<LocalDate, Integer> minutesByDate = new LinkedHashMap<>();
            for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
                minutesByDate.put(d, 0);
            }

            int total = 0;
            for (ServiceExecution exec : executions) {
                if (!hasAssignment(exec, member.getId())) continue;
                Map<LocalDate, Integer> minutesPerDay = minutesPerDayForExecution(exec);
                for (Map.Entry<LocalDate, Integer> entry : minutesPerDay.entrySet()) {
                    if (!minutesByDate.containsKey(entry.getKey())) continue;
                    minutesByDate.merge(entry.getKey(), entry.getValue(), Integer::sum);
                    total += entry.getValue();
                }
            }

            rows.add(new OperatorWorkload(
                    member.getId(), member.getName(), member.getRole().name(),
                    minutesByDate, total));
        }

        rows.sort(Comparator.comparing(OperatorWorkload::totalMinutes).reversed());
        return new WorkloadHeatmapResponse(from, to, rows);
    }

    public List<MaintenanceWindowResponse> getMaintenanceWindows(Long userId, LocalDate from, LocalDate to) {
        ProviderProfile provider = getProviderProfile(userId);

        List<MachineMaintenanceLog> upcoming =
                maintenanceLogRepository.findUpcomingByProviderInRange(provider.getId(), from, to);

        return upcoming.stream()
                .map(m -> new MaintenanceWindowResponse(
                        m.getId(),
                        m.getMachine().getId(),
                        m.getMachine().getName(),
                        m.getPerformedAt(),
                        m.getNextDueAt(),
                        m.getDescription()))
                .toList();
    }

    public CalendarAlertsResponse getAlerts(Long userId, LocalDate from, LocalDate to) {
        ProviderProfile provider = getProviderProfile(userId);

        List<ServiceExecution> executions = executionRepository
                .findByProviderAndScheduledRange(provider.getId(), from, to);

        List<ConflictAlert> conflicts = detectConflicts(executions).stream()
                .map(c -> new ConflictAlert(
                        c.date(), c.resourceType(), c.resourceId(), c.resourceName(),
                        c.conflictingEvents().size()))
                .toList();

        List<MaintenanceAlert> maintenance = maintenanceLogRepository
                .findUpcomingByProviderInRange(provider.getId(), from, to).stream()
                .map(m -> new MaintenanceAlert(
                        m.getId(), m.getMachine().getId(), m.getMachine().getName(),
                        m.getNextDueAt(), m.getDescription()))
                .toList();

        Instant slaCutoff = Instant.now().minus(PAYMENT_SLA_DAYS, ChronoUnit.DAYS);
        List<PaymentAlert> payments = executionRepository
                .findCompletedAwaitingConfirmationBefore(slaCutoff).stream()
                .filter(e -> e.getProposal().getProvider().getId().equals(provider.getId()))
                .map(e -> {
                    LocalDate completedOn = e.getCompletedAt().atZone(java.time.ZoneOffset.UTC).toLocalDate();
                    int days = (int) ChronoUnit.DAYS.between(completedOn, LocalDate.now());
                    return new PaymentAlert(
                            e.getId(),
                            e.getProposal().getRequest().getTitle(),
                            completedOn,
                            days);
                })
                .toList();

        List<ProposalAlert> proposals = proposalRepository
                .findPendingByProviderId(provider.getId()).stream()
                .map(p -> {
                    long competing = proposalRepository.countByRequestIdAndStatus(
                            p.getRequest().getId(),
                            com.agroconnect.model.enums.ProposalStatus.PENDING);
                    LocalDate submittedOn = p.getCreatedAt().atZone(java.time.ZoneOffset.UTC).toLocalDate();
                    return new ProposalAlert(
                            p.getRequest().getId(),
                            p.getRequest().getTitle(),
                            (int) competing,
                            submittedOn);
                })
                .toList();

        return new CalendarAlertsResponse(conflicts, maintenance, payments, proposals);
    }

    @Transactional
    public CalendarEventResponse updateSchedule(Long executionId, ScheduleUpdateDto dto, Long userId) {
        ProviderProfile provider = getProviderProfile(userId);

        ServiceExecution execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new ResourceNotFoundException("Execução não encontrada."));

        if (!execution.getProposal().getProvider().getId().equals(provider.getId())) {
            throw new ForbiddenException("Não tem permissão para alterar esta execução.");
        }

        ensureExecutionReschedulable(execution);

        if (dto.scheduledEndDate().isBefore(dto.scheduledDate())) {
            throw new ValidationException("A data de fim deve ser igual ou posterior à data de início.");
        }

        boolean allDay = dto.allDay() == null || dto.allDay();
        LocalTime start = dto.scheduledStartTime();
        LocalTime end = dto.scheduledEndTime();

        if (allDay && (start != null || end != null)) {
            throw new ValidationException("Eventos de dia inteiro não podem ter hora de início/fim.");
        }
        if (!allDay && (start == null || end == null)) {
            throw new ValidationException("Eventos com hora exigem hora de início e fim.");
        }
        if (!allDay && !end.isAfter(start)) {
            throw new ValidationException("A hora de fim deve ser posterior à hora de início.");
        }

        execution.setScheduledDate(dto.scheduledDate());
        execution.setScheduledEndDate(dto.scheduledEndDate());
        execution.setScheduledAllDay(allDay);
        execution.setScheduledStartTime(allDay ? null : start);
        execution.setScheduledEndTime(allDay ? null : end);
        executionRepository.save(execution);

        log.info("Execution {} rescheduled: {} {} to {} {} (allDay={})",
                executionId, dto.scheduledDate(), start, dto.scheduledEndDate(), end, allDay);
        return toCalendarEvent(execution);
    }

    @Transactional
    public CalendarEventResponse reassignExecution(Long executionId, ReassignExecutionDto dto, Long userId) {
        ProviderProfile provider = getProviderProfile(userId);

        ServiceExecution execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new ResourceNotFoundException("Execução não encontrada."));

        if (!execution.getProposal().getProvider().getId().equals(provider.getId())) {
            throw new ForbiddenException("Não tem permissão para alterar esta execução.");
        }

        ensureExecutionReschedulable(execution);

        TeamMember to = teamMemberRepository.findByIdAndProviderId(dto.toTeamMemberId(), provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Operador de destino não encontrado."));

        ExecutionAssignment target = execution.getAssignments().stream()
                .filter(a -> a.getTeamMember() != null
                        && a.getTeamMember().getId().equals(dto.fromTeamMemberId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Operador atual não está afeto a esta execução."));

        if (executionAssignmentRepository.existsByExecutionIdAndTeamMemberId(
                execution.getId(), dto.toTeamMemberId())
                && !dto.toTeamMemberId().equals(dto.fromTeamMemberId())) {
            throw new ValidationException("O operador de destino já está afeto a esta execução.");
        }

        target.setTeamMember(to);
        if (dto.machineId() != null) {
            Machine machine = target.getMachine();
            if (machine == null || !machine.getId().equals(dto.machineId())) {
                Machine replacement = machineRepository
                        .findByIdAndProviderId(dto.machineId(), provider.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Máquina não encontrada."));
                target.setMachine(replacement);
            }
        }
        executionAssignmentRepository.save(target);

        log.info("Execution {} reassignment: operator {} -> {}",
                executionId, dto.fromTeamMemberId(), dto.toTeamMemberId());

        ServiceExecution refreshed = executionRepository.findById(executionId).orElseThrow();
        return toCalendarEvent(refreshed);
    }

    // ───────── Mapping helpers ─────────

    private void ensureExecutionReschedulable(ServiceExecution execution) {
        if (execution.getCompletedAt() != null) {
            throw new ValidationException("Esta execução já está concluída e não pode ser reagendada.");
        }
        RequestStatus status = execution.getProposal().getRequest().getStatus();
        if (status == RequestStatus.COMPLETED
                || status == RequestStatus.RATED
                || status == RequestStatus.AWAITING_CONFIRMATION
                || status == RequestStatus.DISPUTED
                || status == RequestStatus.CANCELLED
                || status == RequestStatus.EXPIRED) {
            throw new ValidationException(
                    "Não é possível alterar a agenda de um pedido no estado " + status.name() + ".");
        }
    }

    private CalendarEventResponse toCalendarEvent(ServiceExecution exec) {
        ServiceRequest request = exec.getProposal().getRequest();

        List<CalendarAssignment> assignments = exec.getAssignments().stream()
                .filter(a -> a.getTeamMember() != null)
                .map(a -> new CalendarAssignment(
                        a.getTeamMember().getId(),
                        a.getTeamMember().getName(),
                        a.getMachine() != null ? a.getMachine().getId() : null,
                        a.getMachine() != null ? a.getMachine().getName() : null
                ))
                .toList();

        return new CalendarEventResponse(
                exec.getId(),
                request.getId(),
                request.getTitle(),
                request.getCategory().getName(),
                exec.getScheduledDate(),
                exec.getScheduledEndDate(),
                exec.getScheduledStartTime(),
                exec.getScheduledEndTime(),
                exec.isScheduledAllDay(),
                request.getStatus().name(),
                request.getIsland(),
                request.getParish(),
                request.getUrgency().name(),
                assignments
        );
    }

    // ───────── Conflict detection (timed-overlap aware) ─────────

    private List<ConflictResponse> detectConflicts(List<ServiceExecution> executions) {
        Map<String, Map<LocalDate, List<ServiceExecution>>> resourceSchedule = buildResourceSchedule(executions);
        return collectConflicts(resourceSchedule);
    }

    private Map<String, Map<LocalDate, List<ServiceExecution>>> buildResourceSchedule(List<ServiceExecution> executions) {
        Map<String, Map<LocalDate, List<ServiceExecution>>> resourceSchedule = new HashMap<>();
        for (ServiceExecution exec : executions) {
            if (exec.getScheduledDate() == null || exec.getScheduledEndDate() == null) continue;
            LocalDate date = exec.getScheduledDate();
            while (!date.isAfter(exec.getScheduledEndDate())) {
                addAssignmentsToSchedule(resourceSchedule, exec, date);
                date = date.plusDays(1);
            }
        }
        return resourceSchedule;
    }

    private void addAssignmentsToSchedule(
            Map<String, Map<LocalDate, List<ServiceExecution>>> resourceSchedule,
            ServiceExecution exec, LocalDate date) {
        for (ExecutionAssignment assignment : exec.getAssignments()) {
            if (assignment.getTeamMember() != null) {
                registerResource(resourceSchedule,
                        "TEAM_MEMBER:" + assignment.getTeamMember().getId(), date, exec);
            }
            if (assignment.getMachine() != null) {
                registerResource(resourceSchedule, "MACHINE:" + assignment.getMachine().getId(), date, exec);
            }
        }
    }

    private void registerResource(
            Map<String, Map<LocalDate, List<ServiceExecution>>> resourceSchedule,
            String key, LocalDate date, ServiceExecution exec) {
        resourceSchedule
                .computeIfAbsent(key, k -> new HashMap<>())
                .computeIfAbsent(date, k -> new ArrayList<>())
                .add(exec);
    }

    private List<ConflictResponse> collectConflicts(
            Map<String, Map<LocalDate, List<ServiceExecution>>> resourceSchedule) {
        List<ConflictResponse> conflicts = new ArrayList<>();
        for (Map.Entry<String, Map<LocalDate, List<ServiceExecution>>> entry : resourceSchedule.entrySet()) {
            String[] parts = entry.getKey().split(":");
            String resourceType = parts[0];
            Long resourceId = Long.valueOf(parts[1]);
            for (Map.Entry<LocalDate, List<ServiceExecution>> dateEntry : entry.getValue().entrySet()) {
                appendConflictIfAny(conflicts, resourceType, resourceId, dateEntry.getKey(), dateEntry.getValue());
            }
        }
        return conflicts;
    }

    private void appendConflictIfAny(List<ConflictResponse> conflicts,
                                     String resourceType, Long resourceId,
                                     LocalDate date, List<ServiceExecution> execs) {
        if (execs.size() <= 1) return;
        List<ServiceExecution> overlapping = filterTimeOverlapping(execs, date);
        if (overlapping.size() <= 1) return;
        conflicts.add(buildConflictResponse(date, resourceType, resourceId, overlapping));
    }

    /**
     * Among executions sharing the same date for the same resource, keep only those whose
     * time windows actually overlap. All-day events block the whole day and therefore
     * collide with everything else on that date.
     */
    private List<ServiceExecution> filterTimeOverlapping(List<ServiceExecution> execs, LocalDate date) {
        boolean anyAllDay = execs.stream().anyMatch(e -> isAllDayOnDate(e, date));
        if (anyAllDay) return execs;

        List<ServiceExecution> result = new ArrayList<>();
        for (int i = 0; i < execs.size(); i++) {
            if (hasAnyOverlap(execs, i, date) && !result.contains(execs.get(i))) {
                result.add(execs.get(i));
            }
        }
        return result;
    }

    private boolean hasAnyOverlap(List<ServiceExecution> execs, int index, LocalDate date) {
        ServiceExecution candidate = execs.get(index);
        for (int j = 0; j < execs.size(); j++) {
            if (j != index && overlapOnDate(candidate, execs.get(j), date)) {
                return true;
            }
        }
        return false;
    }

    private boolean isAllDayOnDate(ServiceExecution exec, LocalDate date) {
        if (exec.isScheduledAllDay()) return true;
        // Multi-day event with times: only first/last day carry the times; middle days are full
        return !exec.getScheduledDate().equals(date) && !exec.getScheduledEndDate().equals(date);
    }

    private boolean overlapOnDate(ServiceExecution a, ServiceExecution b, LocalDate date) {
        if (isAllDayOnDate(a, date) || isAllDayOnDate(b, date)) return true;
        LocalTime aStart = a.getScheduledStartTime();
        LocalTime aEnd = a.getScheduledEndTime();
        LocalTime bStart = b.getScheduledStartTime();
        LocalTime bEnd = b.getScheduledEndTime();
        if (aStart == null || aEnd == null || bStart == null || bEnd == null) return true;
        return aStart.isBefore(bEnd) && bStart.isBefore(aEnd);
    }

    private ConflictResponse buildConflictResponse(
            LocalDate date, String resourceType, Long resourceId, List<ServiceExecution> execs) {
        String resourceName = findResourceName(execs, resourceType, resourceId);
        List<ConflictingEvent> events = execs.stream()
                .map(e -> new ConflictingEvent(
                        e.getId(),
                        e.getProposal().getRequest().getTitle()
                ))
                .toList();
        return new ConflictResponse(date, resourceType, resourceId, resourceName, events);
    }

    private String findResourceName(List<ServiceExecution> executions, String type, Long id) {
        for (ServiceExecution exec : executions) {
            for (ExecutionAssignment a : exec.getAssignments()) {
                if ("TEAM_MEMBER".equals(type)
                        && a.getTeamMember() != null
                        && a.getTeamMember().getId().equals(id)) {
                    return a.getTeamMember().getName();
                }
                if ("MACHINE".equals(type) && a.getMachine() != null && a.getMachine().getId().equals(id)) {
                    return a.getMachine().getName();
                }
            }
        }
        return "Desconhecido";
    }

    // ───────── Workload / summary helpers ─────────

    private long countByStatus(List<ServiceExecution> executions, RequestStatus status) {
        return executions.stream()
                .filter(e -> e.getProposal().getRequest().getStatus() == status)
                .count();
    }

    private boolean hasAssignment(ServiceExecution exec, Long teamMemberId) {
        return exec.getAssignments().stream()
                .anyMatch(a -> a.getTeamMember() != null
                        && a.getTeamMember().getId().equals(teamMemberId));
    }

    private Map<LocalDate, Integer> minutesPerDayForExecution(ServiceExecution exec) {
        Map<LocalDate, Integer> minutes = new HashMap<>();
        if (exec.getScheduledDate() == null || exec.getScheduledEndDate() == null) return minutes;
        LocalDate start = exec.getScheduledDate();
        LocalDate end = exec.getScheduledEndDate();
        boolean multiDay = !start.equals(end);

        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            int dayMinutes;
            if (exec.isScheduledAllDay() || multiDay) {
                dayMinutes = WORK_DAY_MINUTES;
            } else {
                LocalTime s = exec.getScheduledStartTime();
                LocalTime e = exec.getScheduledEndTime();
                if (s == null || e == null) {
                    dayMinutes = WORK_DAY_MINUTES;
                } else {
                    dayMinutes = (int) Duration.between(s, e).toMinutes();
                }
            }
            minutes.put(d, dayMinutes);
        }
        return minutes;
    }

    private BigDecimal computeUtilization(List<ServiceExecution> executions,
                                          LocalDate from, LocalDate to,
                                          Long providerId) {
        List<TeamMember> active = teamMemberRepository.findByProviderIdAndActiveTrue(providerId);
        if (active.isEmpty()) return BigDecimal.ZERO;

        long workdays = countWeekdays(from, to);
        if (workdays == 0) return BigDecimal.ZERO;

        long capacityMinutes = active.size() * workdays * WORK_DAY_MINUTES;
        if (capacityMinutes == 0) return BigDecimal.ZERO;

        long scheduledMinutes = 0;
        for (ServiceExecution exec : executions) {
            Map<LocalDate, Integer> daily = minutesPerDayForExecution(exec);
            int execMinutes = daily.values().stream().mapToInt(Integer::intValue).sum();
            int distinctOperators = (int) exec.getAssignments().stream()
                    .map(ExecutionAssignment::getTeamMember)
                    .filter(java.util.Objects::nonNull)
                    .map(TeamMember::getId)
                    .distinct()
                    .count();
            scheduledMinutes += (long) execMinutes * Math.max(1, distinctOperators);
        }

        return BigDecimal.valueOf(scheduledMinutes)
                .divide(BigDecimal.valueOf(capacityMinutes), 4, RoundingMode.HALF_UP);
    }

    private long countWeekdays(LocalDate from, LocalDate to) {
        long count = 0;
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            int dow = d.getDayOfWeek().getValue();
            if (dow >= 1 && dow <= 5) count++;
        }
        return count;
    }

    private ProviderProfile getProviderProfile(Long userId) {
        return providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de prestador não encontrado."));
    }
}
