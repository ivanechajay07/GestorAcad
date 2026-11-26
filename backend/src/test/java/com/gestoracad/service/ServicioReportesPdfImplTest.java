package com.gestoracad.service;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoActa;
import com.gestoracad.dto.DtoPortalEstudiante;
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
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
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

    @Mock
    private ServicioPortalAcademico portalService;

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

    @Test
    @DisplayName("Debe generar la constancia de notas del estudiante y registrar la exportación")
    void generatesStudentRecordPdf() {
        DtoUniversidad university = new DtoUniversidad();
        university.setName("Universidad Tecnológica del Perú");
        university.setTaxId("20462509236");

        DtoPortalEstudiante student = new DtoPortalEstudiante();
        student.setCode("2023-010482");
        student.setFirstName("Lucía");
        student.setLastName("Vega Cárdenas");
        student.setCareer("Ingeniería de Sistemas e Informática");
        student.setFaculty("Facultad de Ingeniería y Arquitectura");

        DtoPortalEstudiante.Curso course = new DtoPortalEstudiante.Curso();
        course.setSectionId(3L);
        course.setPeriodCode("2026-II");
        course.setCourseCode("MAT-101");
        course.setCourseName("Matemática I");
        course.setSectionCode("A");
        course.setCredits(4);
        course.setTeacherName("Carlos Santana");
        course.setSchedule("LUN-MIE 08:00-10:00");
        course.setActaStatus("ABIERTA");
        course.setPresent(8);
        course.setAbsent(2);
        course.setLate(0);

        DtoPortalEstudiante.Nota grade = new DtoPortalEstudiante.Nota();
        grade.setEvaluationName("Examen final");
        grade.setType("PRACTICA");
        grade.setWeight(new BigDecimal("100"));
        grade.setScore(new BigDecimal("15"));
        grade.setMaxScore(new BigDecimal("20"));
        course.getGrades().add(grade);

        when(portalService.getStudentSummary()).thenReturn(student);
        when(portalService.getStudentHistory()).thenReturn(List.of(course));
        when(universityService.getActiveUniversity()).thenReturn(university);

        DtoReporteExportacion result = pdfService.exportarConstanciaEstudiante(3L, "127.0.0.1", "JUnit");

        assertThat(result.nombreArchivo()).startsWith("constancia_notas_MAT-101-A_").endsWith(".pdf");
        assertThat(result.contenido().length).isGreaterThan(1000);
        assertThat(new String(result.contenido(), 0, 4, StandardCharsets.US_ASCII)).isEqualTo("%PDF");
        verify(auditService).log(
                any(),
                eq(AccionAuditoria.EXPORT),
                eq("PORTALES"),
                any(String.class),
                eq("/api/v1/portal/student/sections/3/constancia.pdf"),
                eq("GET"),
                eq("127.0.0.1"),
                eq("SUCCESS"),
                eq("JUnit"),
                eq("tb_secciones"),
                eq(3L));
    }

    @Test
    @DisplayName("Debe generar el reporte de avance académico del estudiante")
    void generatesStudentProgressReportPdf() {
        DtoUniversidad university = new DtoUniversidad();
        university.setName("Universidad Tecnológica del Perú");

        DtoPortalEstudiante student = new DtoPortalEstudiante();
        student.setCode("2023-010482");
        student.setFirstName("Lucía");
        student.setLastName("Vega Cárdenas");
        student.setCareer("Ingeniería de Sistemas e Informática");
        student.setFaculty("Facultad de Ingeniería y Arquitectura");
        student.setCurrentCycle(6);
        student.setCondition("REGULAR");
        student.setApprovedCredits(118);
        student.setWeightedAverage(new BigDecimal("17.85"));
        student.setMinimumGrade(new BigDecimal("12"));

        DtoPortalEstudiante.Curso course = new DtoPortalEstudiante.Curso();
        course.setPeriodCode("2026-II");
        course.setCourseCode("MAT-101");
        course.setCourseName("Matemática I");
        course.setSectionCode("A");
        course.setCredits(4);
        course.setTeacherName("Carlos Santana");
        course.setActaStatus("ABIERTA");
        student.getCourses().add(course);

        DtoPortalEstudiante.Plan plan = new DtoPortalEstudiante.Plan();
        plan.setCode("PLAN-IS-2026");
        plan.setName("Plan de Estudios Ingeniería de Sistemas 2026");
        plan.setTotalCredits(11);
        plan.setApprovedCredits(0);
        plan.setProgressPercent(0);
        DtoPortalEstudiante.PlanCourse planCourse = new DtoPortalEstudiante.PlanCourse();
        planCourse.setCourseCode("MAT-101");
        planCourse.setCourseName("Matemática I");
        planCourse.setCycle(1);
        planCourse.setCredits(4);
        planCourse.setMandatory(true);
        planCourse.setStatus("EN_CURSO");
        plan.getCourses().add(planCourse);
        student.setPlan(plan);

        when(portalService.getStudentSummary()).thenReturn(student);
        when(universityService.getActiveUniversity()).thenReturn(university);

        DtoReporteExportacion result = pdfService.exportarReporteAvance("127.0.0.1", "JUnit");

        assertThat(result.nombreArchivo()).startsWith("reporte_avance_2023-010482_").endsWith(".pdf");
        assertThat(result.contenido().length).isGreaterThan(1000);
        assertThat(new String(result.contenido(), 0, 4, StandardCharsets.US_ASCII)).isEqualTo("%PDF");
        verify(auditService).log(
                any(),
                eq(AccionAuditoria.EXPORT),
                eq("PORTALES"),
                any(String.class),
                eq("/api/v1/portal/student/report.pdf"),
                eq("GET"),
                eq("127.0.0.1"),
                eq("SUCCESS"),
                eq("JUnit"),
                eq("tb_estudiantes"),
                isNull());
    }
}
