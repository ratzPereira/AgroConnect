package com.agroconnect.service;

import com.agroconnect.dto.response.FinanceSummaryResponse;
import com.agroconnect.dto.response.MonthlyBreakdownEntry;
import com.agroconnect.dto.response.MonthlyBreakdownResponse;
import com.agroconnect.dto.response.TransactionResponse;
import com.agroconnect.dto.response.YearlyComparisonResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.mapper.TransactionMapper;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.Transaction;
import com.agroconnect.model.enums.TransactionStatus;
import com.agroconnect.repository.ExecutionAssignmentRepository;
import com.agroconnect.repository.ExecutionResourceUsageRepository;
import com.agroconnect.repository.MachineExpenseRepository;
import com.agroconnect.repository.MachineMaintenanceLogRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Year;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinanceService {

    private static final int MONEY_SCALE = 2;
    private static final int PCT_SCALE = 2;

    private final TransactionRepository transactionRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final ExecutionResourceUsageRepository resourceUsageRepository;
    private final ExecutionAssignmentRepository assignmentRepository;
    private final MachineMaintenanceLogRepository maintenanceRepository;
    private final MachineExpenseRepository expenseRepository;

    public FinanceSummaryResponse getSummary(Long userId, Integer requestedYear) {
        ProviderProfile provider = getProviderProfile(userId);
        Long providerId = provider.getId();
        int year = requestedYear != null ? requestedYear : Year.now(ZoneOffset.UTC).getValue();

        BigDecimal totalRevenue = transactionRepository.sumReleasedAmountByProviderId(providerId);
        BigDecimal totalCommissions = transactionRepository.sumCommissionsByProviderId(providerId);
        BigDecimal totalEarnings = transactionRepository.sumReleasedPayoutByProviderId(providerId);
        BigDecimal pendingPayouts = transactionRepository.sumPendingAmountByProviderId(providerId);
        long completedJobs = transactionRepository.countReleasedByProviderId(providerId);

        YearMonth currentMonth = YearMonth.now(ZoneOffset.UTC);
        Instant monthStart = currentMonth.atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant monthEnd = currentMonth.plusMonths(1).atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        BigDecimal thisMonthEarnings = transactionRepository.sumReleasedPayoutByProviderIdAndPeriod(
                providerId, monthStart, monthEnd);

        BigDecimal avgJobValue = completedJobs > 0
                ? totalRevenue.divide(BigDecimal.valueOf(completedJobs), MONEY_SCALE, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        YearAggregates ya = aggregateYear(providerId, year);

        return new FinanceSummaryResponse(
                totalRevenue, totalCommissions, totalEarnings, pendingPayouts,
                thisMonthEarnings, completedJobs, avgJobValue,
                year,
                ya.revenue, ya.commissions, ya.payouts,
                ya.materialsCost, ya.laborCost, ya.machineExpenses,
                ya.netProfit, ya.margin, ya.completedJobs, ya.avgJobValue, ya.avgJobProfit
        );
    }

    public MonthlyBreakdownResponse getMonthlyBreakdown(Long userId, Integer requestedYear) {
        ProviderProfile provider = getProviderProfile(userId);
        Long providerId = provider.getId();
        int year = requestedYear != null ? requestedYear : Year.now(ZoneOffset.UTC).getValue();

        List<MonthlyBreakdownEntry> months = new ArrayList<>(12);
        for (int m = 1; m <= 12; m++) {
            YearMonth ym = YearMonth.of(year, m);
            Instant from = ym.atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
            Instant to = ym.plusMonths(1).atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
            LocalDate fromDate = ym.atDay(1);
            LocalDate toDate = ym.atEndOfMonth();

            BigDecimal revenue = transactionRepository.sumReleasedAmountByProviderIdAndPeriod(providerId, from, to);
            BigDecimal payouts = transactionRepository.sumReleasedPayoutByProviderIdAndPeriod(providerId, from, to);
            BigDecimal materials = resourceUsageRepository.sumMaterialsCostByProviderInPeriod(providerId, from, to);
            BigDecimal labor = assignmentRepository.sumLaborCostByProviderInPeriod(providerId, from, to);
            BigDecimal maintenance = maintenanceRepository.sumCostByProviderInPeriod(providerId, fromDate, toDate);
            BigDecimal expenses = expenseRepository.sumAmountByProviderInPeriod(providerId, fromDate, toDate);
            BigDecimal machineExpenses = maintenance.add(expenses);
            BigDecimal netProfit = payouts.subtract(materials).subtract(labor).subtract(machineExpenses);
            long completed = transactionRepository.countReleasedByProviderIdAndPeriod(providerId, from, to);

            months.add(new MonthlyBreakdownEntry(
                    m,
                    revenue.setScale(MONEY_SCALE, RoundingMode.HALF_UP),
                    payouts.setScale(MONEY_SCALE, RoundingMode.HALF_UP),
                    materials.setScale(MONEY_SCALE, RoundingMode.HALF_UP),
                    labor.setScale(MONEY_SCALE, RoundingMode.HALF_UP),
                    machineExpenses.setScale(MONEY_SCALE, RoundingMode.HALF_UP),
                    netProfit.setScale(MONEY_SCALE, RoundingMode.HALF_UP),
                    completed
            ));
        }
        return new MonthlyBreakdownResponse(year, months);
    }

    public YearlyComparisonResponse getYearlyComparison(Long userId) {
        ProviderProfile provider = getProviderProfile(userId);
        Long providerId = provider.getId();
        int current = Year.now(ZoneOffset.UTC).getValue();
        int previous = current - 1;

        YearAggregates cur = aggregateYear(providerId, current);
        YearAggregates prev = aggregateYear(providerId, previous);

        BigDecimal revenueDelta = deltaPct(cur.revenue, prev.revenue);
        BigDecimal profitDelta = deltaPct(cur.netProfit, prev.netProfit);

        return new YearlyComparisonResponse(
                current, previous,
                cur.revenue, prev.revenue, revenueDelta,
                cur.netProfit, prev.netProfit, profitDelta,
                cur.completedJobs, prev.completedJobs
        );
    }

    private YearAggregates aggregateYear(Long providerId, int year) {
        Instant from = LocalDate.of(year, 1, 1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant to = LocalDate.of(year + 1, 1, 1).atStartOfDay().toInstant(ZoneOffset.UTC);
        LocalDate fromDate = LocalDate.of(year, 1, 1);
        LocalDate toDate = LocalDate.of(year, 12, 31);

        BigDecimal revenue = transactionRepository.sumReleasedAmountByProviderIdAndPeriod(providerId, from, to);
        BigDecimal commissions = transactionRepository.sumCommissionsByProviderIdAndPeriod(providerId, from, to);
        BigDecimal payouts = transactionRepository.sumReleasedPayoutByProviderIdAndPeriod(providerId, from, to);
        BigDecimal materials = resourceUsageRepository.sumMaterialsCostByProviderInPeriod(providerId, from, to);
        BigDecimal labor = assignmentRepository.sumLaborCostByProviderInPeriod(providerId, from, to);
        BigDecimal maintenance = maintenanceRepository.sumCostByProviderInPeriod(providerId, fromDate, toDate);
        BigDecimal expenses = expenseRepository.sumAmountByProviderInPeriod(providerId, fromDate, toDate);
        BigDecimal machineExpenses = maintenance.add(expenses);
        BigDecimal netProfit = payouts.subtract(materials).subtract(labor).subtract(machineExpenses);
        long completed = transactionRepository.countReleasedByProviderIdAndPeriod(providerId, from, to);

        BigDecimal margin = revenue.signum() == 0
                ? BigDecimal.ZERO
                : netProfit.multiply(BigDecimal.valueOf(100))
                           .divide(revenue, PCT_SCALE, RoundingMode.HALF_UP);
        BigDecimal avgJobValue = completed > 0
                ? revenue.divide(BigDecimal.valueOf(completed), MONEY_SCALE, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal avgJobProfit = completed > 0
                ? netProfit.divide(BigDecimal.valueOf(completed), MONEY_SCALE, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return new YearAggregates(
                revenue.setScale(MONEY_SCALE, RoundingMode.HALF_UP),
                commissions.setScale(MONEY_SCALE, RoundingMode.HALF_UP),
                payouts.setScale(MONEY_SCALE, RoundingMode.HALF_UP),
                materials.setScale(MONEY_SCALE, RoundingMode.HALF_UP),
                labor.setScale(MONEY_SCALE, RoundingMode.HALF_UP),
                machineExpenses.setScale(MONEY_SCALE, RoundingMode.HALF_UP),
                netProfit.setScale(MONEY_SCALE, RoundingMode.HALF_UP),
                margin, completed, avgJobValue, avgJobProfit
        );
    }

    private BigDecimal deltaPct(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.signum() == 0) {
            return null;
        }
        return current.subtract(previous)
                .multiply(BigDecimal.valueOf(100))
                .divide(previous.abs(), PCT_SCALE, RoundingMode.HALF_UP);
    }

    public Page<TransactionResponse> getTransactionHistory(Long userId, Pageable pageable) {
        return transactionRepository.findByProviderUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(TransactionMapper::toResponse);
    }

    public byte[] exportTransactionsCsv(Long userId, LocalDate from, LocalDate to) {
        getProviderProfile(userId);

        Instant fromInstant = from.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant toInstant = to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);

        List<Transaction> transactions = transactionRepository
                .findByProviderUserIdAndDateRange(userId, fromInstant, toInstant);

        StringBuilder csv = new StringBuilder();
        csv.append("Data,ID Pedido,Valor Bruto,Comissão,Valor Líquido,Estado\n");

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")
                .withZone(ZoneOffset.UTC);

        for (Transaction t : transactions) {
            csv.append(fmt.format(t.getCreatedAt())).append(',')
               .append(t.getRequest().getId()).append(',')
               .append(t.getAmount()).append(',')
               .append(t.getCommissionAmount()).append(',')
               .append(t.getProviderPayout()).append(',')
               .append(translateStatus(t.getStatus())).append('\n');
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private static final Map<TransactionStatus, String> STATUS_LABELS = Map.of(
            TransactionStatus.PENDING, "Pendente",
            TransactionStatus.HELD, "Retido",
            TransactionStatus.RELEASED, "Libertado",
            TransactionStatus.REFUNDED, "Reembolsado"
    );

    private String translateStatus(TransactionStatus status) {
        return STATUS_LABELS.getOrDefault(status, status.name());
    }

    private ProviderProfile getProviderProfile(Long userId) {
        return providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ForbiddenException("Perfil de prestador não encontrado."));
    }

    private record YearAggregates(
            BigDecimal revenue,
            BigDecimal commissions,
            BigDecimal payouts,
            BigDecimal materialsCost,
            BigDecimal laborCost,
            BigDecimal machineExpenses,
            BigDecimal netProfit,
            BigDecimal margin,
            long completedJobs,
            BigDecimal avgJobValue,
            BigDecimal avgJobProfit
    ) {}
}
