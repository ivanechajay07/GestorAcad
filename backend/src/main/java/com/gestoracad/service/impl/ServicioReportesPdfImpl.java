package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoActa;
import com.gestoracad.dto.DtoReporteExportacion;
import com.gestoracad.dto.DtoUniversidad;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioEvaluacionAcademica;
import com.gestoracad.service.ServicioReportesPdf;
import com.gestoracad.service.ServicioUniversidad;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.ColumnText;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Genera el acta de evaluación en PDF con cabecera institucional,
 * resultados por estudiante y espacio de firmas.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioReportesPdfImpl implements ServicioReportesPdf {

    private static final Color PRIMARY = new Color(29, 78, 216);
    private static final Color INK = new Color(15, 23, 42);
    private static final Color MUTED = new Color(100, 116, 139);
    private static final Color BORDER = new Color(203, 213, 225);
    private static final Color SOFT = new Color(241, 245, 249);
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private static final Font BRAND = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, Font.BOLD, PRIMARY);
    private static final Font TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 17, Font.BOLD, INK);
    private static final Font SUBTITLE = FontFactory.getFont(FontFactory.HELVETICA, 9, Font.NORMAL, MUTED);
    private static final Font LABEL = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Font.BOLD, MUTED);
    private static final Font VALUE = FontFactory.getFont(FontFactory.HELVETICA, 9, Font.NORMAL, INK);
    private static final Font TABLE_HEAD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Font.BOLD, Color.WHITE);
    private static final Font TABLE_CELL = FontFactory.getFont(FontFactory.HELVETICA, 8, Font.NORMAL, INK);
    private static final Font NOTE = FontFactory.getFont(FontFactory.HELVETICA, 7.5f, Font.NORMAL, MUTED);

    private final ServicioEvaluacionAcademica evaluationService;
    private final ServicioUniversidad universityService;
    private final ServicioAuditoria auditService;

    public ServicioReportesPdfImpl(ServicioEvaluacionAcademica evaluationService,
                                   ServicioUniversidad universityService,
                                   ServicioAuditoria auditService) {
        this.evaluationService = evaluationService;
        this.universityService = universityService;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public DtoReporteExportacion exportarActa(Long sectionId, String clientIp, String userAgent) {
        DtoActa acta = evaluationService.getActa(sectionId);
        byte[] content = renderActa(acta);
        auditService.log(
                UtilidadesSeguridad.getCurrentUsername(),
                AccionAuditoria.EXPORT,
                "REPORTES",
                "Exportación del acta de evaluación de la sección " + acta.getCourseCode() + "-" + acta.getSectionCode(),
                "/api/v1/reports/sections/" + sectionId + "/acta.pdf",
                "GET",
                clientIp,
                "SUCCESS",
                userAgent,
                "tb_actas",
                acta.getId());
        String filename = "acta_" + safe(acta.getCourseCode()) + "-" + safe(acta.getSectionCode())
                + "_" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + ".pdf";
        return new DtoReporteExportacion(filename, content);
    }

    private byte[] renderActa(DtoActa acta) {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 42, 42, 42, 56);
        PdfWriter writer = PdfWriter.getInstance(document, output);
        writer.setPageEvent(new PdfPageEventHelper() {
            @Override
            public void onEndPage(PdfWriter pdfWriter, Document pdfDocument) {
                Phrase footer = new Phrase(
                        "Documento generado automáticamente por el Gestor Académico Virtual · "
                                + LocalDateTime.now().format(DATE_TIME),
                        NOTE);
                ColumnText.showTextAligned(pdfWriter.getDirectContent(), Element.ALIGN_CENTER,
                        footer, PageSize.A4.getWidth() / 2, 24, 0);
            }
        });
        document.open();

        DtoUniversidad university = activeUniversity();
        String institution = university != null && university.getName() != null
                ? university.getName()
                : "Institución académica";
        String taxId = university != null && university.getTaxId() != null
                ? "RUC " + university.getTaxId()
                : "";

        Paragraph brand = new Paragraph(institution, BRAND);
        brand.setSpacingAfter(2);
        document.add(brand);
        Paragraph legend = new Paragraph("Sistema de Gestión Académica" + (taxId.isBlank() ? "" : " · " + taxId), SUBTITLE);
        legend.setSpacingAfter(14);
        document.add(legend);

        Paragraph title = new Paragraph("ACTA DE EVALUACIÓN", TITLE);
        title.setSpacingAfter(2);
        document.add(title);
        Paragraph subtitle = new Paragraph(
                "Sección " + value(acta.getSectionCode()) + " · " + value(acta.getCourseCode()) + " · " + value(acta.getCourseName()),
                SUBTITLE);
        subtitle.setSpacingAfter(14);
        document.add(subtitle);

        PdfPTable meta = new PdfPTable(new float[]{1.2f, 2.2f, 1.2f, 2.2f});
        meta.setWidthPercentage(100);
        meta.setSpacingAfter(14);
        addMeta(meta, "Estado", value(acta.getStatus()));
        addMeta(meta, "Cierre", acta.getClosedAt() == null ? "—" : DATE_TIME.format(acta.getClosedAt()));
        addMeta(meta, "Cerrada por", value(acta.getClosedBy()));
        addMeta(meta, "Estudiantes", String.valueOf(acta.getDetails().size()));
        document.add(meta);

        PdfPTable table = new PdfPTable(new float[]{1.2f, 3.4f, 1.1f, 1.4f, 1f});
        table.setWidthPercentage(100);
        table.setHeaderRows(1);
        header(table, "Código");
        header(table, "Estudiante");
        header(table, "Promedio");
        header(table, "Condición");
        header(table, "Créditos");

        if (acta.getDetails().isEmpty()) {
            PdfPCell empty = new PdfPCell(new Phrase("Sin estudiantes registrados en el acta.", TABLE_CELL));
            empty.setColspan(5);
            empty.setPadding(12);
            empty.setBorderColor(BORDER);
            empty.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(empty);
        } else {
            boolean alternate = false;
            for (DtoActa.DtoActaDetalle detail : acta.getDetails()) {
                cell(table, value(detail.getStudentCode()), alternate, Element.ALIGN_LEFT);
                cell(table, value(detail.getStudentName()), alternate, Element.ALIGN_LEFT);
                cell(table, average(detail.getAverage()), alternate, Element.ALIGN_CENTER);
                cell(table, detail.isApproved() ? "Aprobado" : "Desaprobado", alternate, Element.ALIGN_CENTER);
                cell(table, String.valueOf(detail.getCredits()), alternate, Element.ALIGN_CENTER);
                alternate = !alternate;
            }
        }
        document.add(table);

        Paragraph note = new Paragraph(
                "El promedio se calcula con las evaluaciones ponderadas de la sección. "
                        + "Un acta cerrada bloquea la edición de notas, asistencia y evaluaciones.",
                NOTE);
        note.setSpacingBefore(10);
        document.add(note);

        PdfPTable signatures = new PdfPTable(3);
        signatures.setWidthPercentage(100);
        signatures.setSpacingBefore(42);
        signature(signatures, "Docente de la sección");
        signature(signatures, "Coordinación académica");
        signature(signatures, "Dirección de escuela");
        document.add(signatures);

        document.close();
        return output.toByteArray();
    }

    private void addMeta(PdfPTable table, String label, String value) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label.toUpperCase(), LABEL));
        labelCell.setBorder(Rectangle.BOTTOM);
        labelCell.setBorderColor(BORDER);
        labelCell.setPadding(6);
        table.addCell(labelCell);
        PdfPCell valueCell = new PdfPCell(new Phrase(value, VALUE));
        valueCell.setBorder(Rectangle.BOTTOM);
        valueCell.setBorderColor(BORDER);
        valueCell.setPadding(6);
        table.addCell(valueCell);
    }

    private void header(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, TABLE_HEAD));
        cell.setBackgroundColor(PRIMARY);
        cell.setBorderColor(PRIMARY);
        cell.setPadding(7);
        table.addCell(cell);
    }

    private void cell(PdfPTable table, String text, boolean alternate, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, TABLE_CELL));
        cell.setBackgroundColor(alternate ? SOFT : Color.WHITE);
        cell.setBorderColor(BORDER);
        cell.setPadding(6);
        cell.setHorizontalAlignment(alignment);
        table.addCell(cell);
    }

    private void signature(PdfPTable table, String label) {
        PdfPCell cell = new PdfPCell(new Phrase(label, LABEL));
        cell.setBorder(Rectangle.TOP);
        cell.setBorderColor(BORDER);
        cell.setPaddingTop(26);
        cell.setPaddingBottom(4);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private DtoUniversidad activeUniversity() {
        try {
            return universityService.getActiveUniversity();
        } catch (RuntimeException ex) {
            return null;
        }
    }

    private String average(BigDecimal value) {
        return value == null ? "—" : value.stripTrailingZeros().toPlainString();
    }

    private String value(String value) {
        return value == null || value.isBlank() ? "—" : value;
    }

    private String safe(String value) {
        return value == null ? "seccion" : value.replaceAll("[^A-Za-z0-9_-]", "");
    }
}
