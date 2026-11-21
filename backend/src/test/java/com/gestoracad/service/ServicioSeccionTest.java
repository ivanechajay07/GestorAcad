package com.gestoracad.service;

import com.gestoracad.dto.DtoSeccion;
import com.gestoracad.entity.Curso;
import com.gestoracad.entity.PeriodoAcademico;
import com.gestoracad.entity.Seccion;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.mapper.MapeadorSeccion;
import com.gestoracad.repository.RepositorioCurso;
import com.gestoracad.repository.RepositorioDocente;
import com.gestoracad.repository.RepositorioMatricula;
import com.gestoracad.repository.RepositorioPeriodoAcademico;
import com.gestoracad.repository.RepositorioSeccion;
import com.gestoracad.service.impl.ServicioSeccionImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Pruebas unitarias de secciones.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@ExtendWith(MockitoExtension.class)
class ServicioSeccionTest {

    @Mock
    private RepositorioSeccion sectionRepository;
    @Mock
    private RepositorioPeriodoAcademico periodRepository;
    @Mock
    private RepositorioCurso courseRepository;
    @Mock
    private RepositorioDocente teacherRepository;
    @Mock
    private RepositorioMatricula enrollmentRepository;
    @Mock
    private ServicioAuditoria auditService;

    private ServicioSeccionImpl sectionService;

    @BeforeEach
    void setUp() {
        sectionService = new ServicioSeccionImpl(sectionRepository, periodRepository, courseRepository,
                teacherRepository, enrollmentRepository, new MapeadorSeccion(), auditService);
    }

    private PeriodoAcademico period() {
        PeriodoAcademico period = new PeriodoAcademico();
        period.setId(1L);
        period.setCode("2026-II");
        period.setName("Periodo 2026-II");
        period.setStartDate(LocalDate.of(2026, 8, 10));
        period.setEndDate(LocalDate.of(2026, 12, 18));
        period.setActive(true);
        return period;
    }

    private Curso course() {
        Curso course = new Curso();
        course.setId(2L);
        course.setCode("MAT-101");
        course.setName("Matemática I");
        course.setCredits(4);
        course.setActive(true);
        return course;
    }

    private DtoSeccion payload(int capacity) {
        DtoSeccion dto = new DtoSeccion();
        dto.setPeriodId(1L);
        dto.setCourseId(2L);
        dto.setCode("A");
        dto.setCapacity(capacity);
        dto.setShift("MAÑANA");
        return dto;
    }

    @Test
    @DisplayName("Registra una sección y calcula el cupo disponible")
    void createsSection() {
        when(periodRepository.findById(1L)).thenReturn(Optional.of(period()));
        when(courseRepository.findById(2L)).thenReturn(Optional.of(course()));
        when(sectionRepository.findByPeriodIdAndCourseIdAndCodeIgnoreCase(1L, 2L, "A")).thenReturn(Optional.empty());
        when(sectionRepository.save(any(Seccion.class))).thenAnswer(invocation -> {
            Seccion saved = invocation.getArgument(0);
            saved.setId(9L);
            return saved;
        });
        when(enrollmentRepository.countActiveBySectionId(9L)).thenReturn(3L);

        DtoSeccion result = sectionService.createSection(payload(30), "127.0.0.1", "JUnit");

        assertEquals("MAT-101", result.getCourseCode());
        assertEquals(3L, result.getEnrolledCount());
        assertEquals(27L, result.getAvailable());
    }

    @Test
    @DisplayName("Rechaza una sección duplicada para el mismo curso y periodo")
    void rejectsDuplicate() {
        when(periodRepository.findById(1L)).thenReturn(Optional.of(period()));
        when(courseRepository.findById(2L)).thenReturn(Optional.of(course()));
        Seccion existing = new Seccion();
        existing.setId(9L);
        when(sectionRepository.findByPeriodIdAndCourseIdAndCodeIgnoreCase(1L, 2L, "A"))
                .thenReturn(Optional.of(existing));

        assertThrows(ExcepcionApi.class, () -> sectionService.createSection(payload(30), "127.0.0.1", "JUnit"));
        verify(sectionRepository, never()).save(any());
    }

    @Test
    @DisplayName("No permite desactivar una sección con matrículas activas")
    void cannotDeleteSectionWithEnrollments() {
        Seccion section = new Seccion();
        section.setId(9L);
        section.setCourse(course());
        section.setCode("A");
        when(sectionRepository.findById(9L)).thenReturn(Optional.of(section));
        when(enrollmentRepository.countActiveBySectionId(9L)).thenReturn(2L);

        ExcepcionApi error = assertThrows(ExcepcionApi.class,
                () -> sectionService.deleteSection(9L, "127.0.0.1", "JUnit"));

        assertTrue(error.getMessage().contains("estudiantes matriculados"));
    }

    @Test
    @DisplayName("No permite reducir la capacidad por debajo de los matriculados")
    void cannotReduceCapacityBelowEnrolled() {
        Seccion section = new Seccion();
        section.setId(9L);
        section.setCapacity(30);
        section.setCourse(course());
        section.setPeriod(period());
        section.setCode("A");
        when(sectionRepository.findById(9L)).thenReturn(Optional.of(section));
        when(periodRepository.findById(1L)).thenReturn(Optional.of(period()));
        when(courseRepository.findById(2L)).thenReturn(Optional.of(course()));
        when(sectionRepository.findByPeriodIdAndCourseIdAndCodeIgnoreCase(1L, 2L, "A"))
                .thenReturn(Optional.of(section));
        when(enrollmentRepository.countActiveBySectionId(9L)).thenReturn(5L);

        assertThrows(ExcepcionApi.class, () -> sectionService.updateSection(9L, payload(4), "127.0.0.1", "JUnit"));
    }
}
