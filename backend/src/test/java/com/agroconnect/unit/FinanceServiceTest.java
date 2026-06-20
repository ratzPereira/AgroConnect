package com.agroconnect.unit;

import com.agroconnect.dto.response.FinanceSummaryResponse;
import com.agroconnect.dto.response.MonthlyBreakdownResponse;
import com.agroconnect.dto.response.YearlyComparisonResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.fixture.ProposalFixture;
import com.agroconnect.fixture.ServiceRequestFixture;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.Proposal;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.Transaction;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.model.enums.TransactionStatus;
import com.agroconnect.repository.ExecutionAssignmentRepository;
import com.agroconnect.repository.ExecutionResourceUsageRepository;
import com.agroconnect.repository.MachineExpenseRepository;
import com.agroconnect.repository.MachineMaintenanceLogRepository;
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.TransactionRepository;
import com.agroconnect.service.FinanceService;
import com.agroconnect.service.FinancialReportPdfGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Year;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FinanceServiceTest {

    @Mock private TransactionRepository transactionRepository;
    @Mock private ProviderProfileRepository providerProfileRepository;
    @Mock private ExecutionResourceUsageRepository resourceUsageRepository;
    @Mock private ExecutionAssignmentRepository assignmentRepository;
    @Mock private MachineMaintenanceLogRepository maintenanceRepository;
    @Mock private MachineExpenseRepository expenseRepository;
    @Mock private FinancialReportPdfGenerator pdfGenerator;

    private FinanceService service;

    private User providerUser;
    private ProviderProfile providerProfile;

    @BeforeEach
    void setUp() {
        service = new FinanceService(
                transactionRepository,
                providerProfileRepository,
                resourceUsageRepository,
                assignmentRepository,
                maintenanceRepository,
                expenseRepository,
                pdfGenerator
        );

        providerUser = UserFixture.aProviderUser().build();
        providerProfile = UserFixture.aProviderProfile().user(providerUser).build();
    }

    private void stubAnnualAggregatesToZero() {
        lenient().when(transactionRepository.sumReleasedAmountByProviderIdAndPeriod(anyLong(), any(Instant.class), any(Instant.class)))
                .thenReturn(BigDecimal.ZERO);
        lenient().when(transactionRepository.sumCommissionsByProviderIdAndPeriod(anyLong(), any(Instant.class), any(Instant.class)))
                .thenReturn(BigDecimal.ZERO);
        lenient().when(transactionRepository.sumReleasedPayoutByProviderIdAndPeriod(anyLong(), any(Instant.class), any(Instant.class)))
                .thenReturn(BigDecimal.ZERO);
        lenient().when(transactionRepository.countReleasedByProviderIdAndPeriod(anyLong(), any(Instant.class), any(Instant.class)))
                .thenReturn(0L);
        lenient().when(resourceUsageRepository.sumMaterialsCostByProviderInPeriod(anyLong(), any(Instant.class), any(Instant.class)))
                .thenReturn(BigDecimal.ZERO);
        lenient().when(assignmentRepository.sumLaborCostByProviderInPeriod(anyLong(), any(Instant.class), any(Instant.class)))
                .thenReturn(BigDecimal.ZERO);
        lenient().when(maintenanceRepository.sumCostByProviderInPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(BigDecimal.ZERO);
        lenient().when(expenseRepository.sumAmountByProviderInPeriod(anyLong(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(BigDecimal.ZERO);
    }

    @Test
    void getSummary_givenProviderWithTransactions_shouldReturnAggregates() {
        stubAnnualAggregatesToZero();
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(transactionRepository.sumReleasedAmountByProviderId(1L)).thenReturn(new BigDecimal("1000.00"));
        when(transactionRepository.sumCommissionsByProviderId(1L)).thenReturn(new BigDecimal("120.00"));
        when(transactionRepository.sumReleasedPayoutByProviderId(1L)).thenReturn(new BigDecimal("880.00"));
        when(transactionRepository.sumPendingAmountByProviderId(1L)).thenReturn(new BigDecimal("250.00"));
        when(transactionRepository.countReleasedByProviderId(1L)).thenReturn(4L);
        when(transactionRepository.sumReleasedPayoutByProviderIdAndPeriod(eq(1L), any(Instant.class), any(Instant.class)))
                .thenReturn(new BigDecimal("220.00"));

        FinanceSummaryResponse response = service.getSummary(2L, null);

        assertNotNull(response);
        assertEquals(new BigDecimal("1000.00"), response.totalRevenue());
        assertEquals(new BigDecimal("880.00"), response.totalEarnings());
        assertEquals(4, response.completedJobs());
        assertEquals(new BigDecimal("250.00"), response.avgJobValue());
        assertEquals(Year.now(ZoneOffset.UTC).getValue(), response.year());
    }

    @Test
    void getSummary_givenEmptyTransactions_shouldReturnZeros() {
        stubAnnualAggregatesToZero();
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(transactionRepository.sumReleasedAmountByProviderId(1L)).thenReturn(BigDecimal.ZERO);
        when(transactionRepository.sumCommissionsByProviderId(1L)).thenReturn(BigDecimal.ZERO);
        when(transactionRepository.sumReleasedPayoutByProviderId(1L)).thenReturn(BigDecimal.ZERO);
        when(transactionRepository.sumPendingAmountByProviderId(1L)).thenReturn(BigDecimal.ZERO);
        when(transactionRepository.countReleasedByProviderId(1L)).thenReturn(0L);
        when(transactionRepository.sumReleasedPayoutByProviderIdAndPeriod(eq(1L), any(Instant.class), any(Instant.class)))
                .thenReturn(BigDecimal.ZERO);

        FinanceSummaryResponse response = service.getSummary(2L, null);

        assertEquals(BigDecimal.ZERO, response.totalRevenue());
        assertEquals(BigDecimal.ZERO, response.avgJobValue());
        assertEquals(0, response.completedJobs());
    }

    @Test
    void getSummary_givenSpecificYear_shouldComputeAnnualAggregates() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(transactionRepository.sumReleasedAmountByProviderId(1L)).thenReturn(BigDecimal.ZERO);
        when(transactionRepository.sumCommissionsByProviderId(1L)).thenReturn(BigDecimal.ZERO);
        when(transactionRepository.sumReleasedPayoutByProviderId(1L)).thenReturn(BigDecimal.ZERO);
        when(transactionRepository.sumPendingAmountByProviderId(1L)).thenReturn(BigDecimal.ZERO);
        when(transactionRepository.countReleasedByProviderId(1L)).thenReturn(0L);

        when(transactionRepository.sumReleasedAmountByProviderIdAndPeriod(eq(1L), any(Instant.class), any(Instant.class)))
                .thenReturn(new BigDecimal("10000.00"));
        when(transactionRepository.sumCommissionsByProviderIdAndPeriod(eq(1L), any(Instant.class), any(Instant.class)))
                .thenReturn(new BigDecimal("1200.00"));
        when(transactionRepository.sumReleasedPayoutByProviderIdAndPeriod(eq(1L), any(Instant.class), any(Instant.class)))
                .thenReturn(new BigDecimal("8800.00"));
        when(transactionRepository.countReleasedByProviderIdAndPeriod(eq(1L), any(Instant.class), any(Instant.class)))
                .thenReturn(10L);
        when(resourceUsageRepository.sumMaterialsCostByProviderInPeriod(eq(1L), any(Instant.class), any(Instant.class)))
                .thenReturn(new BigDecimal("1500.00"));
        when(assignmentRepository.sumLaborCostByProviderInPeriod(eq(1L), any(Instant.class), any(Instant.class)))
                .thenReturn(new BigDecimal("2000.00"));
        when(maintenanceRepository.sumCostByProviderInPeriod(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("300.00"));
        when(expenseRepository.sumAmountByProviderInPeriod(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("200.00"));

        FinanceSummaryResponse response = service.getSummary(2L, 2025);

        assertEquals(2025, response.year());
        assertEquals(new BigDecimal("10000.00"), response.yearRevenue());
        assertEquals(new BigDecimal("1200.00"), response.yearCommissions());
        assertEquals(new BigDecimal("8800.00"), response.yearPayouts());
        assertEquals(new BigDecimal("1500.00"), response.yearMaterialsCost());
        assertEquals(new BigDecimal("2000.00"), response.yearLaborCost());
        assertEquals(new BigDecimal("500.00"), response.yearMachineExpenses());
        // netProfit = 8800 - 1500 - 2000 - 500 = 4800
        assertEquals(new BigDecimal("4800.00"), response.yearNetProfit());
        // margin = 4800 / 10000 * 100 = 48.00
        assertEquals(new BigDecimal("48.00"), response.yearMargin());
        assertEquals(10, response.yearCompletedJobs());
        // avgJobValue = 10000 / 10 = 1000.00
        assertEquals(new BigDecimal("1000.00"), response.yearAvgJobValue());
        // avgJobProfit = 4800 / 10 = 480.00
        assertEquals(new BigDecimal("480.00"), response.yearAvgJobProfit());
    }

    @Test
    void getSummary_givenNonProvider_shouldThrowForbidden() {
        when(providerProfileRepository.findByUserId(999L)).thenReturn(Optional.empty());

        assertThrows(ForbiddenException.class, () -> service.getSummary(999L, null));
    }

    @Test
    void getMonthlyBreakdown_shouldReturn12Entries() {
        stubAnnualAggregatesToZero();
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

        MonthlyBreakdownResponse response = service.getMonthlyBreakdown(2L, 2025);

        assertNotNull(response);
        assertEquals(2025, response.year());
        assertEquals(12, response.months().size());
        for (int i = 0; i < 12; i++) {
            assertEquals(i + 1, response.months().get(i).month());
        }
    }

    @Test
    void getMonthlyBreakdown_shouldComputeNetProfitPerMonth() {
        stubAnnualAggregatesToZero();
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

        // Return non-zero values for all months — net profit = payouts - materials - labor - machineExpenses
        when(transactionRepository.sumReleasedPayoutByProviderIdAndPeriod(eq(1L), any(Instant.class), any(Instant.class)))
                .thenReturn(new BigDecimal("1000.00"));
        when(resourceUsageRepository.sumMaterialsCostByProviderInPeriod(eq(1L), any(Instant.class), any(Instant.class)))
                .thenReturn(new BigDecimal("200.00"));
        when(assignmentRepository.sumLaborCostByProviderInPeriod(eq(1L), any(Instant.class), any(Instant.class)))
                .thenReturn(new BigDecimal("300.00"));
        when(maintenanceRepository.sumCostByProviderInPeriod(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("50.00"));
        when(expenseRepository.sumAmountByProviderInPeriod(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("50.00"));

        MonthlyBreakdownResponse response = service.getMonthlyBreakdown(2L, 2025);

        // netProfit = 1000 - 200 - 300 - (50+50) = 400 for each month
        var januaryEntry = response.months().get(0);
        assertEquals(new BigDecimal("1000.00"), januaryEntry.payouts());
        assertEquals(new BigDecimal("200.00"), januaryEntry.materialsCost());
        assertEquals(new BigDecimal("300.00"), januaryEntry.laborCost());
        assertEquals(new BigDecimal("100.00"), januaryEntry.machineExpenses());
        assertEquals(new BigDecimal("400.00"), januaryEntry.netProfit());
    }

    @Test
    void getMonthlyBreakdown_givenNullYear_shouldUseCurrentYear() {
        stubAnnualAggregatesToZero();
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

        MonthlyBreakdownResponse response = service.getMonthlyBreakdown(2L, null);

        assertEquals(Year.now(ZoneOffset.UTC).getValue(), response.year());
    }

    @Test
    void getYearlyComparison_shouldComputeDeltas() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

        int currentYear = Year.now(ZoneOffset.UTC).getValue();
        Instant curStart = LocalDate.of(currentYear, 1, 1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant prevStart = LocalDate.of(currentYear - 1, 1, 1).atStartOfDay().toInstant(ZoneOffset.UTC);

        // Current year: revenue 12000, payouts 10000, materials 1000, labor 1000, maintenance 200, expenses 300
        when(transactionRepository.sumReleasedAmountByProviderIdAndPeriod(eq(1L), eq(curStart), any(Instant.class)))
                .thenReturn(new BigDecimal("12000.00"));
        when(transactionRepository.sumReleasedPayoutByProviderIdAndPeriod(eq(1L), eq(curStart), any(Instant.class)))
                .thenReturn(new BigDecimal("10000.00"));
        when(transactionRepository.countReleasedByProviderIdAndPeriod(eq(1L), eq(curStart), any(Instant.class)))
                .thenReturn(12L);
        when(transactionRepository.sumCommissionsByProviderIdAndPeriod(eq(1L), eq(curStart), any(Instant.class)))
                .thenReturn(new BigDecimal("2000.00"));
        when(resourceUsageRepository.sumMaterialsCostByProviderInPeriod(eq(1L), eq(curStart), any(Instant.class)))
                .thenReturn(new BigDecimal("1000.00"));
        when(assignmentRepository.sumLaborCostByProviderInPeriod(eq(1L), eq(curStart), any(Instant.class)))
                .thenReturn(new BigDecimal("1000.00"));
        when(maintenanceRepository.sumCostByProviderInPeriod(eq(1L),
                eq(LocalDate.of(currentYear, 1, 1)), any(LocalDate.class)))
                .thenReturn(new BigDecimal("200.00"));
        when(expenseRepository.sumAmountByProviderInPeriod(eq(1L),
                eq(LocalDate.of(currentYear, 1, 1)), any(LocalDate.class)))
                .thenReturn(new BigDecimal("300.00"));

        // Previous year: revenue 10000, payouts 8000, materials 1000, labor 1000, maintenance 100, expenses 100
        when(transactionRepository.sumReleasedAmountByProviderIdAndPeriod(eq(1L), eq(prevStart), any(Instant.class)))
                .thenReturn(new BigDecimal("10000.00"));
        when(transactionRepository.sumReleasedPayoutByProviderIdAndPeriod(eq(1L), eq(prevStart), any(Instant.class)))
                .thenReturn(new BigDecimal("8000.00"));
        when(transactionRepository.countReleasedByProviderIdAndPeriod(eq(1L), eq(prevStart), any(Instant.class)))
                .thenReturn(10L);
        when(transactionRepository.sumCommissionsByProviderIdAndPeriod(eq(1L), eq(prevStart), any(Instant.class)))
                .thenReturn(new BigDecimal("1500.00"));
        when(resourceUsageRepository.sumMaterialsCostByProviderInPeriod(eq(1L), eq(prevStart), any(Instant.class)))
                .thenReturn(new BigDecimal("1000.00"));
        when(assignmentRepository.sumLaborCostByProviderInPeriod(eq(1L), eq(prevStart), any(Instant.class)))
                .thenReturn(new BigDecimal("1000.00"));
        when(maintenanceRepository.sumCostByProviderInPeriod(eq(1L),
                eq(LocalDate.of(currentYear - 1, 1, 1)), any(LocalDate.class)))
                .thenReturn(new BigDecimal("100.00"));
        when(expenseRepository.sumAmountByProviderInPeriod(eq(1L),
                eq(LocalDate.of(currentYear - 1, 1, 1)), any(LocalDate.class)))
                .thenReturn(new BigDecimal("100.00"));

        YearlyComparisonResponse response = service.getYearlyComparison(2L);

        assertEquals(currentYear, response.currentYear());
        assertEquals(currentYear - 1, response.previousYear());
        assertEquals(new BigDecimal("12000.00"), response.currentRevenue());
        assertEquals(new BigDecimal("10000.00"), response.previousRevenue());
        // Revenue delta: (12000 - 10000) / 10000 * 100 = 20.00
        assertEquals(new BigDecimal("20.00"), response.revenueDeltaPct());
        // Current profit: 10000 - 1000 - 1000 - 500 = 7500
        assertEquals(new BigDecimal("7500.00"), response.currentProfit());
        // Previous profit: 8000 - 1000 - 1000 - 200 = 5800
        assertEquals(new BigDecimal("5800.00"), response.previousProfit());
        // Profit delta: (7500 - 5800) / 5800 * 100 = 29.31
        assertEquals(new BigDecimal("29.31"), response.profitDeltaPct());
        assertEquals(12L, response.currentJobs());
        assertEquals(10L, response.previousJobs());
    }

    @Test
    void getYearlyComparison_givenZeroPreviousYear_shouldReturnNullDelta() {
        stubAnnualAggregatesToZero();
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));

        int currentYear = Year.now(ZoneOffset.UTC).getValue();
        Instant curStart = LocalDate.of(currentYear, 1, 1).atStartOfDay().toInstant(ZoneOffset.UTC);

        when(transactionRepository.sumReleasedAmountByProviderIdAndPeriod(eq(1L), eq(curStart), any(Instant.class)))
                .thenReturn(new BigDecimal("5000.00"));
        when(transactionRepository.sumReleasedPayoutByProviderIdAndPeriod(eq(1L), eq(curStart), any(Instant.class)))
                .thenReturn(new BigDecimal("4400.00"));

        YearlyComparisonResponse response = service.getYearlyComparison(2L);

        assertEquals(new BigDecimal("5000.00"), response.currentRevenue());
        assertEquals(BigDecimal.ZERO.setScale(2), response.previousRevenue());
        assertNull(response.revenueDeltaPct());
        assertNull(response.profitDeltaPct());
    }

    @Test
    void getTransactionHistory_shouldReturnPaginatedResults() {
        when(transactionRepository.findByProviderUserIdOrderByCreatedAtDesc(eq(2L), any()))
                .thenReturn(Page.empty());

        var result = service.getTransactionHistory(2L, PageRequest.of(0, 20));

        assertNotNull(result);
    }

    @Test
    void exportTransactionsCsv_givenTransactions_shouldReturnCsvWithHeader() {
        ServiceRequest request = ServiceRequestFixture.aRequest()
                .status(RequestStatus.COMPLETED)
                .client(UserFixture.aClientUser().build())
                .category(ServiceRequestFixture.aCategory().build()).build();
        Proposal proposal = ProposalFixture.aProposal()
                .request(request).provider(providerProfile).build();
        Transaction tx = ProposalFixture.aTransaction()
                .status(TransactionStatus.RELEASED)
                .request(request).proposal(proposal)
                .createdAt(Instant.parse("2025-06-15T10:30:00Z"))
                .build();

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(transactionRepository.findByProviderUserIdAndDateRange(eq(2L), any(Instant.class), any(Instant.class)))
                .thenReturn(List.of(tx));

        byte[] csv = service.exportTransactionsCsv(2L, LocalDate.of(2025, 6, 1), LocalDate.of(2025, 6, 30));
        String content = new String(csv, StandardCharsets.UTF_8);

        assertTrue(content.startsWith("Data,ID Pedido,Valor Bruto,"));
        assertTrue(content.contains("Libertado"));
        assertTrue(content.contains("250.00"));
    }

    @Test
    void exportTransactionsCsv_givenEmptyRange_shouldReturnHeaderOnly() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(transactionRepository.findByProviderUserIdAndDateRange(eq(2L), any(Instant.class), any(Instant.class)))
                .thenReturn(List.of());

        byte[] csv = service.exportTransactionsCsv(2L, LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31));
        String content = new String(csv, StandardCharsets.UTF_8);

        assertTrue(content.startsWith("Data,ID Pedido,"));
        long lineCount = content.chars().filter(c -> c == '\n').count();
        assertEquals(1, lineCount);
    }

    @Test
    void exportTransactionsCsv_givenNonProvider_shouldThrowForbidden() {
        when(providerProfileRepository.findByUserId(999L)).thenReturn(Optional.empty());

        assertThrows(ForbiddenException.class,
                () -> service.exportTransactionsCsv(999L, LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
    }

    @Test
    void exportTransactionsCsv_givenHeldTransaction_shouldTranslateStatusToRetido() {
        ServiceRequest request = ServiceRequestFixture.aRequest()
                .status(RequestStatus.AWARDED)
                .client(UserFixture.aClientUser().build())
                .category(ServiceRequestFixture.aCategory().build()).build();
        Proposal proposal = ProposalFixture.aProposal()
                .request(request).provider(providerProfile).build();
        Transaction tx = ProposalFixture.aTransaction()
                .status(TransactionStatus.HELD)
                .request(request).proposal(proposal)
                .createdAt(Instant.parse("2025-03-10T08:00:00Z"))
                .build();

        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(transactionRepository.findByProviderUserIdAndDateRange(eq(2L), any(Instant.class), any(Instant.class)))
                .thenReturn(List.of(tx));

        byte[] csv = service.exportTransactionsCsv(2L, LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31));
        String content = new String(csv, StandardCharsets.UTF_8);

        assertTrue(content.contains("Retido"));
    }
}
