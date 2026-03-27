package com.agroconnect.service;

import com.agroconnect.dto.request.ScheduleUpdateDto;
import com.agroconnect.dto.response.CalendarEventResponse;
import com.agroconnect.dto.response.CalendarEventResponse.CalendarAssignment;
import com.agroconnect.dto.response.ConflictResponse;
import com.agroconnect.dto.response.ConflictResponse.ConflictingEvent;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.exception.ValidationException;
import com.agroconnect.model.ExecutionAssignment;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.ServiceExecution;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.ServiceExecutionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CalendarService {

    private static final Logger log = LoggerFactory.getLogger(CalendarService.class);

    private final ServiceExecutionRepository executionRepository;
    private final ProviderProfileRepository providerProfileRepository;

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

    @Transactional
    public CalendarEventResponse updateSchedule(Long executionId, ScheduleUpdateDto dto, Long userId) {
        ProviderProfile provider = getProviderProfile(userId);

        ServiceExecution execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new ResourceNotFoundException("Execução não encontrada."));

        if (!execution.getProposal().getProvider().getId().equals(provider.getId())) {
            throw new ForbiddenException("Não tem permissão para alterar esta execução.");
        }

        if (dto.scheduledEndDate().isBefore(dto.scheduledDate())) {
            throw new ValidationException("A data de fim deve ser igual ou posterior à data de início.");
        }

        execution.setScheduledDate(dto.scheduledDate());
        execution.setScheduledEndDate(dto.scheduledEndDate());
        executionRepository.save(execution);

        log.info("Execution {} rescheduled: {} to {}", executionId, dto.scheduledDate(), dto.scheduledEndDate());
        return toCalendarEvent(execution);
    }

    private CalendarEventResponse toCalendarEvent(ServiceExecution exec) {
        ServiceRequest request = exec.getProposal().getRequest();

        List<CalendarAssignment> assignments = exec.getAssignments().stream()
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
                request.getStatus().name(),
                request.getIsland(),
                request.getParish(),
                request.getUrgency().name(),
                assignments
        );
    }

    private List<ConflictResponse> detectConflicts(List<ServiceExecution> executions) {
        // Map: resourceKey -> Map<date, List<execution>>
        Map<String, Map<LocalDate, List<ServiceExecution>>> resourceSchedule = new HashMap<>();

        for (ServiceExecution exec : executions) {
            if (exec.getScheduledDate() == null || exec.getScheduledEndDate() == null) continue;

            LocalDate date = exec.getScheduledDate();
            while (!date.isAfter(exec.getScheduledEndDate())) {
                for (ExecutionAssignment assignment : exec.getAssignments()) {
                    // Track team member
                    String tmKey = "TEAM_MEMBER:" + assignment.getTeamMember().getId();
                    resourceSchedule
                            .computeIfAbsent(tmKey, k -> new HashMap<>())
                            .computeIfAbsent(date, k -> new ArrayList<>())
                            .add(exec);

                    // Track machine
                    if (assignment.getMachine() != null) {
                        String mKey = "MACHINE:" + assignment.getMachine().getId();
                        resourceSchedule
                                .computeIfAbsent(mKey, k -> new HashMap<>())
                                .computeIfAbsent(date, k -> new ArrayList<>())
                                .add(exec);
                    }
                }
                date = date.plusDays(1);
            }
        }

        List<ConflictResponse> conflicts = new ArrayList<>();

        for (Map.Entry<String, Map<LocalDate, List<ServiceExecution>>> entry : resourceSchedule.entrySet()) {
            String[] parts = entry.getKey().split(":");
            String resourceType = parts[0];
            Long resourceId = Long.valueOf(parts[1]);

            for (Map.Entry<LocalDate, List<ServiceExecution>> dateEntry : entry.getValue().entrySet()) {
                List<ServiceExecution> execs = dateEntry.getValue();
                if (execs.size() <= 1) continue;

                // Conflict detected
                String resourceName = findResourceName(execs, resourceType, resourceId);

                List<ConflictingEvent> events = execs.stream()
                        .map(e -> new ConflictingEvent(
                                e.getId(),
                                e.getProposal().getRequest().getTitle()
                        ))
                        .toList();

                conflicts.add(new ConflictResponse(
                        dateEntry.getKey(), resourceType, resourceId, resourceName, events
                ));
            }
        }

        return conflicts;
    }

    private String findResourceName(List<ServiceExecution> executions, String type, Long id) {
        for (ServiceExecution exec : executions) {
            for (ExecutionAssignment a : exec.getAssignments()) {
                if ("TEAM_MEMBER".equals(type) && a.getTeamMember().getId().equals(id)) {
                    return a.getTeamMember().getName();
                }
                if ("MACHINE".equals(type) && a.getMachine() != null && a.getMachine().getId().equals(id)) {
                    return a.getMachine().getName();
                }
            }
        }
        return "Desconhecido";
    }

    private ProviderProfile getProviderProfile(Long userId) {
        return providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de prestador não encontrado."));
    }
}
