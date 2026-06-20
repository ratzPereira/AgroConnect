package com.agroconnect.service;

import com.agroconnect.dto.response.TransactionResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface FinancialReportPdfGenerator {

    byte[] generate(ProviderInfo provider,
                    LocalDate from,
                    LocalDate to,
                    List<TransactionResponse> transactions,
                    FinancialTotals totals);

    record ProviderInfo(String displayName, String taxId) {}

    record FinancialTotals(BigDecimal grossRevenue,
                           BigDecimal commission,
                           BigDecimal netRevenue,
                           int completedJobs) {}
}
