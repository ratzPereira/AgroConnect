package com.agroconnect.unit;

import com.agroconnect.dto.response.FinanceSummaryResponse;
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
import com.agroconnect.repository.ProviderProfileRepository;
import com.agroconnect.repository.TransactionRepository;
import com.agroconnect.service.FinanceService;
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
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FinanceServiceTest {

    @Mock private TransactionRepository transactionRepository;
    @Mock private ProviderProfileRepository providerProfileRepository;

    private FinanceService service;

    private User providerUser;
    private ProviderProfile providerProfile;

    @BeforeEach
    void setUp() {
        service = new FinanceService(transactionRepository, providerProfileRepository);

        providerUser = UserFixture.aProviderUser().build();
        providerProfile = UserFixture.aProviderProfile().user(providerUser).build();
    }

    @Test
    void getSummary_givenProviderWithTransactions_shouldReturnAggregates() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(transactionRepository.sumReleasedAmountByProviderId(1L)).thenReturn(new BigDecimal("1000.00"));
        when(transactionRepository.sumCommissionsByProviderId(1L)).thenReturn(new BigDecimal("120.00"));
        when(transactionRepository.sumReleasedPayoutByProviderId(1L)).thenReturn(new BigDecimal("880.00"));
        when(transactionRepository.sumPendingAmountByProviderId(1L)).thenReturn(new BigDecimal("250.00"));
        when(transactionRepository.countReleasedByProviderId(1L)).thenReturn(4L);
        when(transactionRepository.sumReleasedPayoutByProviderIdAndPeriod(eq(1L), any(Instant.class), any(Instant.class)))
                .thenReturn(new BigDecimal("220.00"));

        FinanceSummaryResponse response = service.getSummary(2L);

        assertNotNull(response);
        assertEquals(new BigDecimal("1000.00"), response.totalRevenue());
        assertEquals(new BigDecimal("880.00"), response.totalEarnings());
        assertEquals(4, response.completedJobs());
        assertEquals(new BigDecimal("250.00"), response.avgJobValue());
    }

    @Test
    void getSummary_givenEmptyTransactions_shouldReturnZeros() {
        when(providerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(providerProfile));
        when(transactionRepository.sumReleasedAmountByProviderId(1L)).thenReturn(BigDecimal.ZERO);
        when(transactionRepository.sumCommissionsByProviderId(1L)).thenReturn(BigDecimal.ZERO);
        when(transactionRepository.sumReleasedPayoutByProviderId(1L)).thenReturn(BigDecimal.ZERO);
        when(transactionRepository.sumPendingAmountByProviderId(1L)).thenReturn(BigDecimal.ZERO);
        when(transactionRepository.countReleasedByProviderId(1L)).thenReturn(0L);
        when(transactionRepository.sumReleasedPayoutByProviderIdAndPeriod(eq(1L), any(Instant.class), any(Instant.class)))
                .thenReturn(BigDecimal.ZERO);

        FinanceSummaryResponse response = service.getSummary(2L);

        assertEquals(BigDecimal.ZERO, response.totalRevenue());
        assertEquals(BigDecimal.ZERO, response.avgJobValue());
        assertEquals(0, response.completedJobs());
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
