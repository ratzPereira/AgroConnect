package com.agroconnect.service.impl;

import com.agroconnect.dto.response.TransactionResponse;
import com.agroconnect.model.enums.TransactionStatus;
import com.agroconnect.service.FinancialReportPdfGenerator;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.ColumnText;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
public class OpenPdfFinancialReportGenerator implements FinancialReportPdfGenerator {

    private static final Logger log = LoggerFactory.getLogger(OpenPdfFinancialReportGenerator.class);

    private static final String FONT_REGULAR = "/fonts/LiberationSans-Regular.ttf";
    private static final String FONT_BOLD = "/fonts/LiberationSans-Bold.ttf";
    private static final String LOGO_RESOURCE = "/static/agroconnect-logo.png";
    private static final float LOGO_MAX_WIDTH = 120f;

    private static final Locale PT_PT = new Locale("pt", "PT");
    // Custom pt-PT currency: dot grouping + comma decimal (matches expected user-facing format
    // "1.234,56 €"). The default JDK pt-PT NumberFormat uses NBSP grouping, which is harder to
    // read in printed reports.
    private static final NumberFormat CURRENCY_FMT = buildPtCurrencyFormat();

    private static NumberFormat buildPtCurrencyFormat() {
        var symbols = new DecimalFormatSymbols(PT_PT);
        symbols.setGroupingSeparator('.');
        symbols.setDecimalSeparator(',');
        symbols.setCurrencySymbol("\u20AC");
        return new DecimalFormat("#,##0.00 \u00A4", symbols);
    }
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy", PT_PT);
    private static final ZoneId LISBON_ZONE = ZoneId.of("Europe/Lisbon");

    private static final Color HEADER_GREEN = new Color(34, 139, 34);
    private static final Color ALT_ROW = new Color(245, 245, 245);

    // Mirrors FinanceService.STATUS_LABELS so PDF and CSV exports stay aligned.
    private static final Map<TransactionStatus, String> STATUS_LABELS = Map.of(
            TransactionStatus.PENDING, "Pendente",
            TransactionStatus.HELD, "Retido",
            TransactionStatus.RELEASED, "Libertado",
            TransactionStatus.REFUNDED, "Reembolsado"
    );

    @Override
    public byte[] generate(ProviderInfo provider,
                           LocalDate from,
                           LocalDate to,
                           List<TransactionResponse> transactions,
                           FinancialTotals totals) {
        var out = new ByteArrayOutputStream();
        var doc = new Document(PageSize.A4, 40, 40, 50, 40);
        var writer = PdfWriter.getInstance(doc, out);
        writer.setPageEvent(new FooterEvent(this));
        doc.open();
        try {
            addLogo(doc);
            doc.add(new Paragraph("AgroConnect — Relatório Financeiro", baseFont(14, true)));
            doc.add(new Paragraph("Prestador: " + provider.displayName(), baseFont(11, false)));
            if (provider.taxId() != null && !provider.taxId().isBlank()) {
                doc.add(new Paragraph("NIF: " + provider.taxId(), baseFont(11, false)));
            }
            doc.add(new Paragraph("Período: " + from.format(DATE_FMT) + " a " + to.format(DATE_FMT),
                    baseFont(11, false)));
            writeTotalsBlock(doc, totals);
            if (transactions.isEmpty()) {
                doc.add(new Paragraph("Sem movimentos no período seleccionado.", baseFont(11, false)));
            } else {
                writeTable(doc, transactions);
            }
        } catch (Exception e) {
            log.error("Failed to write PDF body", e);
            throw new IllegalStateException("PDF generation failed", e);
        } finally {
            doc.close();
        }
        return out.toByteArray();
    }

    private void addLogo(Document doc) {
        try (InputStream in = getClass().getResourceAsStream(LOGO_RESOURCE)) {
            if (in == null) {
                log.warn("Logo resource not found at {} — skipping", LOGO_RESOURCE);
                return;
            }
            var logo = Image.getInstance(in.readAllBytes());
            if (logo.getWidth() > LOGO_MAX_WIDTH) {
                logo.scaleToFit(LOGO_MAX_WIDTH, LOGO_MAX_WIDTH);
            }
            logo.setAlignment(Element.ALIGN_LEFT);
            doc.add(logo);
        } catch (Exception e) {
            log.warn("Failed to embed AgroConnect logo: {}", e.getMessage());
        }
    }

    private void writeTotalsBlock(Document doc, FinancialTotals totals) throws DocumentException {
        var table = new PdfPTable(2);
        table.setWidthPercentage(60);
        table.setHorizontalAlignment(Element.ALIGN_LEFT);
        table.setSpacingBefore(15);
        table.setSpacingAfter(15);
        addTotalRow(table, "Receita Bruta", CURRENCY_FMT.format(totals.grossRevenue()));
        addTotalRow(table, "Comissão AgroConnect", CURRENCY_FMT.format(totals.commission()));
        addTotalRow(table, "Receita Líquida", CURRENCY_FMT.format(totals.netRevenue()));
        addTotalRow(table, "Trabalhos Concluídos", String.valueOf(totals.completedJobs()));
        doc.add(table);
    }

    private void addTotalRow(PdfPTable table, String label, String value) {
        var labelCell = new PdfPCell(new Phrase(label, baseFont(11, true)));
        labelCell.setPadding(6);
        var valueCell = new PdfPCell(new Phrase(value, amountFont(11, false)));
        valueCell.setPadding(6);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private void writeTable(Document doc, List<TransactionResponse> transactions) throws DocumentException {
        var table = new PdfPTable(7);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{2, 1.5f, 3, 1.5f, 1.5f, 1.5f, 1.5f});
        String[] headers = {"Data", "Pedido", "Cliente", "Bruto", "Comissão", "Líquido", "Estado"};
        for (var h : headers) {
            var cell = new PdfPCell(new Phrase(h, baseFont(10, true)));
            cell.setBackgroundColor(HEADER_GREEN);
            cell.setPadding(6);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }
        boolean alt = false;
        for (var tx : transactions) {
            var bg = alt ? ALT_ROW : Color.WHITE;
            // TransactionResponse exposes createdAt (Instant) — render in Lisbon zone.
            var date = tx.createdAt().atZone(LISBON_ZONE).toLocalDate().format(DATE_FMT);
            addCell(table, date, bg, false);
            addCell(table, String.valueOf(tx.requestId()), bg, false);
            // No client name on the DTO — use a dash placeholder.
            addCell(table, "-", bg, false);
            addCell(table, CURRENCY_FMT.format(tx.amount()), bg, true);
            addCell(table, CURRENCY_FMT.format(tx.commissionAmount()), bg, true);
            addCell(table, CURRENCY_FMT.format(tx.providerPayout()), bg, true);
            addCell(table, STATUS_LABELS.getOrDefault(tx.status(), tx.status().name()), bg, false);
            alt = !alt;
        }
        doc.add(table);
    }

    private void addCell(PdfPTable table, String text, Color bg, boolean right) {
        // Right-aligned cells hold currency/numeric values — use Helvetica so the formatted
        // number (with dot grouping separator) survives PdfTextExtractor round-trips.
        var font = right ? amountFont(9, false) : baseFont(9, false);
        var cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bg);
        cell.setPadding(4);
        if (right) {
            cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        }
        table.addCell(cell);
    }

    // Built-in Helvetica using WinAnsi encoding extracts cleanly via PdfTextExtractor —
    // we use it for numeric/currency cells where IDENTITY_H subset fonts garble dot characters
    // on read-back. Liberation Sans is still used for headings, labels and prose paragraphs.
    private Font amountFont(float size, boolean bold) {
        try {
            var name = bold ? BaseFont.HELVETICA_BOLD : BaseFont.HELVETICA;
            var bf = BaseFont.createFont(name, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
            return new Font(bf, size);
        } catch (Exception e) {
            log.warn("Failed to load built-in Helvetica: {}", e.getMessage());
            return new Font(Font.HELVETICA, size, bold ? Font.BOLD : Font.NORMAL);
        }
    }

    private Font baseFont(float size, boolean bold) {
        var resource = bold ? FONT_BOLD : FONT_REGULAR;
        try (InputStream in = getClass().getResourceAsStream(resource)) {
            if (in == null) {
                throw new IllegalStateException("Font resource not found: " + resource);
            }
            var bytes = in.readAllBytes();
            var bf = BaseFont.createFont(
                    "LiberationSans" + (bold ? "-Bold" : "") + ".ttf",
                    BaseFont.IDENTITY_H,
                    BaseFont.EMBEDDED,
                    true, bytes, null);
            return new Font(bf, size);
        } catch (Exception e) {
            log.warn("Failed to load Liberation Sans, falling back to Helvetica: {}", e.getMessage());
            return new Font(Font.HELVETICA, size, bold ? Font.BOLD : Font.NORMAL);
        }
    }

    static final class FooterEvent extends PdfPageEventHelper {
        private final OpenPdfFinancialReportGenerator owner;

        FooterEvent(OpenPdfFinancialReportGenerator owner) {
            this.owner = owner;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            try {
                PdfContentByte cb = writer.getDirectContent();
                var phrase = new Phrase(
                        "AgroConnect — Página " + writer.getPageNumber(),
                        owner.amountFont(9, false));
                float x = (document.left() + document.right()) / 2f;
                float y = document.bottom() - 20f;
                ColumnText.showTextAligned(cb, Element.ALIGN_CENTER, phrase, x, y, 0);
            } catch (Exception e) {
                // Footer rendering must never break the document — log and continue.
                LoggerFactory.getLogger(FooterEvent.class)
                        .warn("Failed to render footer: {}", e.getMessage());
            }
        }
    }
}
