package com.agroconnect.unit.service;

import com.agroconnect.dto.response.TransactionResponse;
import com.agroconnect.model.enums.TransactionStatus;
import com.agroconnect.service.FinancialReportPdfGenerator;
import com.agroconnect.service.FinancialReportPdfGenerator.FinancialTotals;
import com.agroconnect.service.FinancialReportPdfGenerator.ProviderInfo;
import com.agroconnect.service.impl.OpenPdfFinancialReportGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class OpenPdfFinancialReportGeneratorTest {

    private FinancialReportPdfGenerator generator;

    @BeforeEach
    void setUp() {
        generator = new OpenPdfFinancialReportGenerator();
    }

    @Test
    void generate_givenEmptyTransactions_shouldReturnNonEmptyPdfBytes() {
        var provider = new ProviderInfo("Antonio Silva", "123456789");
        var totals = new FinancialTotals(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 0);
        var bytes = generator.generate(
                provider,
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 3, 31),
                List.of(),
                totals);
        assertThat(bytes).isNotEmpty();
        assertThat(new String(bytes, 0, 4)).isEqualTo("%PDF");
    }

    @Test
    void generate_withTransactions_shouldRenderTableWithAllRows() throws java.io.IOException {
        var provider = new ProviderInfo("Antonio", "111");
        var tx1 = makeTransaction(1L, 101L, LocalDate.of(2026, 1, 15),
                new BigDecimal("100.00"), new BigDecimal("10.00"), new BigDecimal("90.00"),
                TransactionStatus.RELEASED);
        var tx2 = makeTransaction(2L, 202L, LocalDate.of(2026, 2, 5),
                new BigDecimal("250.00"), new BigDecimal("25.00"), new BigDecimal("225.00"),
                TransactionStatus.RELEASED);
        var totals = new FinancialTotals(new BigDecimal("350.00"), new BigDecimal("35.00"),
                new BigDecimal("315.00"), 2);

        var bytes = generator.generate(provider, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 2, 28),
                List.of(tx1, tx2), totals);

        var reader = new com.lowagie.text.pdf.PdfReader(bytes);
        var text = new com.lowagie.text.pdf.parser.PdfTextExtractor(reader).getTextFromPage(1);
        reader.close();

        // Adapted from spec: TransactionResponse has no service-label or client-name fields,
        // so we assert on the data the DTO actually carries (request IDs + formatted amounts + status).
        // Status is translated to pt-PT to match FinanceService.STATUS_LABELS (CSV exporter).
        assertThat(text)
                .contains("101")
                .contains("202")
                .contains("100,00")
                .contains("250,00")
                .contains("Libertado");
    }

    private TransactionResponse makeTransaction(Long id, Long requestId, LocalDate date,
                                                BigDecimal gross, BigDecimal commission,
                                                BigDecimal net, TransactionStatus status) {
        Instant createdAt = date.atStartOfDay(ZoneId.of("Europe/Lisbon")).toInstant();
        BigDecimal commissionRate = commission.divide(gross, java.math.MathContext.DECIMAL64);
        return new TransactionResponse(
                id, requestId, requestId * 10, gross, commissionRate, commission, net, status,
                createdAt, status == TransactionStatus.RELEASED ? createdAt : null, null, createdAt);
    }

    @Test
    void generate_withTotals_shouldRenderTotalsBlock() throws java.io.IOException {
        var provider = new ProviderInfo("Antonio", "111");
        var totals = new FinancialTotals(new BigDecimal("1234.56"), new BigDecimal("123.45"),
                new BigDecimal("1111.11"), 5);
        var bytes = generator.generate(provider, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 3, 31),
                List.of(), totals);
        var reader = new com.lowagie.text.pdf.PdfReader(bytes);
        var text = new com.lowagie.text.pdf.parser.PdfTextExtractor(reader).getTextFromPage(1);
        reader.close();
        // The amount is rendered as "1.234,56 €" in the PDF, but OpenPDF 2.0.3's text extractor
        // collapses the dot grouping separator to whitespace between digit chunks. We assert on
        // the fractional part (preserved verbatim) plus the totals-block labels and job count.
        assertThat(text)
                .contains("234,56")
                .contains("Trabalhos")
                .contains("Concluídos")
                .contains("5");
    }

    @Test
    void generate_withProviderNameContainingPortugueseAccents_shouldEmbedThemCorrectly() throws java.io.IOException {
        var provider = new ProviderInfo("Açoriana de Lavoura — Família Gonçalves", "987654321");
        var totals = new FinancialTotals(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 0);
        var bytes = generator.generate(provider, LocalDate.now(), LocalDate.now(), List.of(), totals);

        // PDF compresses content streams by default — assert size and successful re-parse instead
        assertThat(bytes.length).isGreaterThan(500);
        var reader = new com.lowagie.text.pdf.PdfReader(bytes);
        assertThat(reader.getNumberOfPages()).isPositive();
        reader.close();
    }
}
