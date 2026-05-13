package com.agroconnect.service;

import com.agroconnect.dto.request.RecordResourceUsageDto;
import com.agroconnect.dto.request.UpdateAssignmentHoursDto;
import com.agroconnect.dto.response.AssignmentCostResponse;
import com.agroconnect.dto.response.ExecutionResourceUsageResponse;
import com.agroconnect.dto.response.JobCostsResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.mapper.JobCostingMapper;
import com.agroconnect.model.ClientProfile;
import com.agroconnect.model.ExecutionAssignment;
import com.agroconnect.model.ExecutionResourceUsage;
import com.agroconnect.model.InventoryItem;
import com.agroconnect.model.InventoryMovement;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.ServiceExecution;
import com.agroconnect.model.User;
import com.agroconnect.repository.ClientProfileRepository;
import com.agroconnect.repository.ExecutionAssignmentRepository;
import com.agroconnect.repository.ExecutionResourceUsageRepository;
import com.agroconnect.repository.InventoryItemRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.ServiceExecutionRepository;
import com.agroconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

/**
 * Job costing — computes real profit per service execution and owns the writes
 * that feed it (resource usage + assignment hours). Resource usage triggers a
 * CONSUMPTION movement on inventory; hours feed labor cost.
 *
 * <p>Once {@code execution.completedAt} is set, all costing data is frozen.
 * The hourly_rate_snapshot on each assignment is set by
 * {@link ExecutionService#complete} so historical labor cost cannot be
 * altered by later changes to a team member's rate.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JobCostingService {

    private static final Logger log = LoggerFactory.getLogger(JobCostingService.class);

    private static final String ERR_EXECUTION_NOT_FOUND = "Execução não encontrada.";
    private static final String ERR_ASSIGNMENT_NOT_FOUND = "Atribuição não encontrada.";
    private static final String ERR_USAGE_NOT_FOUND = "Consumo não encontrado.";
    private static final String ERR_COMPLETED_LOCKED = "Esta execução já foi concluída e não pode ser alterada.";
    private static final String ERR_REQUIRES_CHECKIN = "É necessário fazer check-in antes de registar custos.";
    private static final String ERR_FORBIDDEN = "Não tem permissão para aceder a esta execução.";
    private static final String ERR_USER_NOT_FOUND = "Utilizador não encontrado.";
    private static final String ERR_ITEM_DIFFERENT_PROVIDER = "O item de inventário não pertence ao mesmo prestador.";

    private static final int CURRENCY_SCALE = 2;
    private static final int MARGIN_SCALE = 2;
    private static final MathContext MC = MathContext.DECIMAL64;

    private final ServiceExecutionRepository executionRepository;
    private final ExecutionAssignmentRepository assignmentRepository;
    private final ExecutionResourceUsageRepository resourceUsageRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final InventoryMovementService inventoryMovementService;
    private final ProviderProfileRepository providerProfileRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final UserRepository userRepository;

    @Value("${agroconnect.commission.rate}")
    private BigDecimal commissionRate;

    public JobCostsResponse getCosts(Long executionId, Long userId) {
        ServiceExecution execution = findExecution(executionId);
        validateAccess(execution, userId);
        return computeCosts(execution);
    }

    @Transactional
    public ExecutionResourceUsageResponse recordResourceUsage(Long executionId,
                                                              RecordResourceUsageDto dto,
                                                              Long userId) {
        ServiceExecution execution = findExecution(executionId);
        ProviderProfile provider = validateAccess(execution, userId);
        ensureMutable(execution);

        // Sanity check: the inventory item must belong to the same provider.
        InventoryItem item = inventoryItemRepository.findByIdAndProviderId(dto.inventoryItemId(), provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException(ERR_ITEM_DIFFERENT_PROVIDER));

        BigDecimal qty = InventoryMath.toQty(dto.quantity());
        BigDecimal wacAtConsumption = InventoryMath.toCost(
                item.getCostPerUnit() != null ? item.getCostPerUnit() : BigDecimal.ZERO);

        // Delegate decrement + CONSUMPTION movement to the inventory ledger
        // (it owns row-level locking and stock validation).
        InventoryMovement movement = inventoryMovementService.recordConsumption(
                item.getId(), qty, execution,
                buildConsumptionReason(execution, dto.notes()), userId);

        User actor = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_USER_NOT_FOUND));

        // Re-fetch the item so we read the freshly-decremented quantity if the
        // caller wants to inspect it later. Not required here but defensive.
        ExecutionResourceUsage usage = ExecutionResourceUsage.builder()
                .execution(execution)
                .inventoryItem(item)
                .quantity(qty)
                .unitCostSnapshot(wacAtConsumption)
                .notes(dto.notes())
                .inventoryMovement(movement)
                .recordedBy(actor)
                .build();
        usage = resourceUsageRepository.saveAndFlush(usage);

        log.info("Resource usage {} recorded on execution {}: item {} qty {} @ {}",
                usage.getId(), executionId, item.getId(), qty, wacAtConsumption);
        return JobCostingMapper.toResponse(usage, displayNameOf(actor));
    }

    @Transactional
    public void deleteResourceUsage(Long executionId, Long usageId, Long userId) {
        ServiceExecution execution = findExecution(executionId);
        validateAccess(execution, userId);
        ensureMutable(execution);

        ExecutionResourceUsage usage = resourceUsageRepository.findById(usageId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_USAGE_NOT_FOUND));

        if (!usage.getExecution().getId().equals(executionId)) {
            throw new ResourceNotFoundException(ERR_USAGE_NOT_FOUND);
        }

        // Reverse the CONSUMPTION via an ADJUSTMENT_IN (preserving full ledger history).
        // Stock is restored at the snapshotted unit cost so WAC doesn't drift.
        com.agroconnect.dto.request.RecordAdjustmentInDto adjustment =
                new com.agroconnect.dto.request.RecordAdjustmentInDto(
                        usage.getQuantity(),
                        usage.getUnitCostSnapshot(),
                        "Reversão do consumo #" + usage.getId());
        inventoryMovementService.recordAdjustmentIn(usage.getInventoryItem().getId(), adjustment, userId);

        resourceUsageRepository.delete(usage);
        log.info("Resource usage {} deleted (reversed) on execution {}", usageId, executionId);
    }

    @Transactional
    public AssignmentCostResponse updateAssignmentHours(Long executionId,
                                                        Long assignmentId,
                                                        UpdateAssignmentHoursDto dto,
                                                        Long userId) {
        ServiceExecution execution = findExecution(executionId);
        validateAccess(execution, userId);
        ensureMutable(execution);

        ExecutionAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_ASSIGNMENT_NOT_FOUND));

        if (!assignment.getExecution().getId().equals(executionId)) {
            throw new ResourceNotFoundException(ERR_ASSIGNMENT_NOT_FOUND);
        }

        assignment.setHoursWorked(dto.hoursWorked());
        assignment.setMachineHours(dto.machineHours());
        assignment = assignmentRepository.save(assignment);

        log.info("Assignment {} hours updated on execution {}: worked={} machine={}",
                assignmentId, executionId, dto.hoursWorked(), dto.machineHours());
        return toAssignmentCost(assignment, /*completed*/ false);
    }

    // ─────────────────────── compute ───────────────────────

    private JobCostsResponse computeCosts(ServiceExecution execution) {
        boolean completed = execution.getCompletedAt() != null;

        BigDecimal revenue = revenueOf(execution);

        List<ExecutionResourceUsage> usages =
                resourceUsageRepository.findByExecutionIdOrderByCreatedAtAsc(execution.getId());
        List<ExecutionAssignment> assignments =
                assignmentRepository.findByExecutionId(execution.getId());

        BigDecimal materials = usages.stream()
                .map(ExecutionResourceUsage::getTotalCost)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);

        List<AssignmentCostResponse> assignmentCosts = assignments.stream()
                .map(a -> toAssignmentCost(a, completed))
                .toList();

        BigDecimal labor = assignmentCosts.stream()
                .map(AssignmentCostResponse::laborCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);

        BigDecimal commission = revenue.multiply(commissionRate, MC)
                .setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);

        BigDecimal netProfit = revenue
                .subtract(materials)
                .subtract(labor)
                .subtract(commission)
                .setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);

        BigDecimal marginPercent;
        if (revenue.signum() == 0) {
            marginPercent = BigDecimal.ZERO.setScale(MARGIN_SCALE, RoundingMode.HALF_UP);
        } else {
            marginPercent = netProfit
                    .divide(revenue, MC)
                    .multiply(BigDecimal.valueOf(100), MC)
                    .setScale(MARGIN_SCALE, RoundingMode.HALF_UP);
        }

        int missingRate = (int) assignmentCosts.stream()
                .filter(a -> a.hoursWorked() != null && a.hoursWorked().signum() > 0)
                .filter(a -> a.effectiveHourlyRate() == null || a.effectiveHourlyRate().signum() == 0)
                .count();

        List<ExecutionResourceUsageResponse> usageResponses = usages.stream()
                .map(u -> JobCostingMapper.toResponse(u, displayNameOf(u.getRecordedBy())))
                .toList();

        return new JobCostsResponse(
                execution.getId(),
                completed,
                revenue,
                materials,
                labor,
                commission,
                commissionRate,
                netProfit,
                marginPercent,
                assignmentCosts,
                usageResponses,
                missingRate);
    }

    private AssignmentCostResponse toAssignmentCost(ExecutionAssignment a, boolean completed) {
        BigDecimal hours = a.getHoursWorked();
        BigDecimal effective = effectiveHourlyRate(a, completed);
        BigDecimal labor;
        if (hours == null || effective == null) {
            labor = BigDecimal.ZERO.setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);
        } else {
            labor = hours.multiply(effective, MC).setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);
        }
        return new AssignmentCostResponse(
                a.getId(),
                a.getTeamMember().getId(),
                a.getTeamMember().getName(),
                a.getHoursWorked(),
                a.getMachineHours(),
                effective,
                labor);
    }

    private BigDecimal effectiveHourlyRate(ExecutionAssignment a, boolean completed) {
        // Once completed, the snapshot is authoritative. Before completion we
        // surface the team member's current rate so the user can preview the
        // labor cost as they edit hours.
        if (completed) {
            return a.getHourlyRateSnapshot();
        }
        if (a.getHourlyRateSnapshot() != null) {
            return a.getHourlyRateSnapshot();
        }
        return a.getTeamMember().getHourlyRate();
    }

    private BigDecimal revenueOf(ServiceExecution execution) {
        BigDecimal price = execution.getProposal() != null ? execution.getProposal().getPrice() : null;
        return price != null
                ? price.setScale(CURRENCY_SCALE, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);
    }

    // ─────────────────────── helpers ───────────────────────

    private void ensureMutable(ServiceExecution execution) {
        if (execution.getCompletedAt() != null) {
            throw new InvalidStateException(ERR_COMPLETED_LOCKED);
        }
        if (execution.getCheckinTime() == null) {
            throw new InvalidStateException(ERR_REQUIRES_CHECKIN);
        }
    }

    private ServiceExecution findExecution(Long id) {
        return executionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_EXECUTION_NOT_FOUND));
    }

    private ProviderProfile validateAccess(ServiceExecution execution, Long userId) {
        ProviderProfile provider = providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ForbiddenException(ERR_FORBIDDEN));

        if (!execution.getProposal().getProvider().getId().equals(provider.getId())) {
            throw new ForbiddenException(ERR_FORBIDDEN);
        }
        return provider;
    }

    private String displayNameOf(User user) {
        Optional<String> clientName = clientProfileRepository.findByUserId(user.getId())
                .map(ClientProfile::getName);
        if (clientName.isPresent()) {
            return clientName.get();
        }
        return providerProfileRepository.findByUserId(user.getId())
                .map(ProviderProfile::getCompanyName)
                .orElse(user.getEmail());
    }

    private String buildConsumptionReason(ServiceExecution execution, String userNotes) {
        String base = "Consumo na execução #" + execution.getId();
        if (userNotes != null && !userNotes.isBlank()) {
            return base + " — " + userNotes;
        }
        return base;
    }
}
