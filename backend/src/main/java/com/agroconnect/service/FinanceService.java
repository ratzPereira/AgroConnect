package com.agroconnect.service;

import com.agroconnect.dto.response.FinanceSummaryResponse;
import com.agroconnect.dto.response.TransactionResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.mapper.TransactionMapper;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.Transaction;
import com.agroconnect.model.enums.TransactionStatus;
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
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinanceService {

    private final TransactionRepository transactionRepository;
    private final ProviderProfileRepository providerProfileRepository;

    public FinanceSummaryResponse getSummary(Long userId) {
        ProviderProfile provider = getProviderProfile(userId);
        Long providerId = provider.getId();

        BigDecimal totalRevenue = transactionRepository.sumReleasedAmountByProviderId(providerId);
        BigDecimal totalCommissions = transactionRepository.sumCommissionsByProviderId(providerId);
        BigDecimal totalEarnings = transactionRepository.sumReleasedPayoutByProviderId(providerId);
        BigDecimal pendingPayouts = transactionRepository.sumPendingAmountByProviderId(providerId);
        long completedJobs = transactionRepository.countReleasedByProviderId(providerId);

        // This month earnings
        YearMonth currentMonth = YearMonth.now(ZoneOffset.UTC);
        Instant monthStart = currentMonth.atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant monthEnd = currentMonth.plusMonths(1).atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        BigDecimal thisMonthEarnings = transactionRepository.sumReleasedPayoutByProviderIdAndPeriod(
                providerId, monthStart, monthEnd);

        BigDecimal avgJobValue = completedJobs > 0
                ? totalRevenue.divide(BigDecimal.valueOf(completedJobs), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return new FinanceSummaryResponse(
                totalRevenue,
                totalCommissions,
                totalEarnings,
                pendingPayouts,
                thisMonthEarnings,
                completedJobs,
                avgJobValue
        );
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
}
