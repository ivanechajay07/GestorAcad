package com.gestoracad.service;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoActa;
import com.gestoracad.dto.DtoReporteExportacion;
import com.gestoracad.dto.DtoUniversidad;
import com.gestoracad.service.impl.ServicioReportesPdfImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ServicioReportesPdfImplTest {

    @Mock
    private ServicioEvaluacionAcademica evaluationService;

    @Mock
    private ServicioUniversidad universityService;

    @Mock
    private ServicioAuditoria auditService;

    @InjectMocks
    private ServicioReportesPdfImpl pdfService;

    private DtoActa acta() {
        DtoActa acta = new DtoActa();
        acta.setId(10L);
        acta.setSectionId(3L);
        acta.setSectionCode("A");
        acta.setCourseCode("MAT-101");
        acta.setCourseName("Matemática I");
        acta.setStatus("CERRADA");
        acta.setClosedAt(LocalDateTime.of(2026, 7, 20, 18, 30));
        acta.setClosedBy("admin");

        DtoActa.DtoActaDetalle approved = new DtoActa.DtoActaDetalle();
        approved.setStudentId(1L);
        approved.setStudentCode("2021-0001");
        approved.setStudentName("Ana Torres");
        approved.setAverage(new BigDecimal("16.50"));
        approved.setApproved(true);
        approved.setCredits(4);
        acta.getDetails().add(approved);

        DtoActa.DtoActaDetalle failed = new DtoActa.DtoActaDetalle();
        failed.setStudentId(2L);
        failed.setStudentCode("2021-0002");
        failed.setStudentName("Luis Gómez");
        failed.setAverage(new BigDecimal("8.25"));
        failed.setApproved(false);
        failed.setCredits(4);
        acta.getDetails().add(failed);
        return acta;
    }

    @Test
    @DisplayName("Debe generar un PDF válido del acta y registrar la exportación")
    void generatesActaPdf() {
        DtoUniversidad university = new DtoUniversidad();
        university.setName("Universidad Tecnológica del Perú");
        university.setTaxId("20462509236");

        when(evaluationService.getActa(3L)).thenReturn(acta());
        when(universityService.getActiveUniversity()).thenReturn(university);

        DtoReporteExportacion result = pdfService.exportarActa(3L, "127.0.0.1", "JUnit");

        assertThat(result.nombreArchivo()).startsWith("acta_MAT-101-A_").endsWith(".pdf");
        assertThat(result.contenido().length).isGreaterThan(1000);
        assertThat(new String(result.contenido(), 0, 4, StandardCharsets.US_ASCII)).isEqualTo("%PDF");
        verify(auditService).log(
                any(),
                eq(AccionAuditoria.EXPORT),
                eq("REPORTES"),
                any(String.class),
                eq("/api/v1/reports/sections/3/acta.pdf"),
                eq("GET"),
                eq("127.0.0.1"),
                eq("SUCCESS"),
                eq("JUnit"),
                eq("tb_actas"),
                eq(10L));
    }
}
