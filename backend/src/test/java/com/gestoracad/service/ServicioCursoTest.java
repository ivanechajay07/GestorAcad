package com.gestoracad.service;

import com.gestoracad.dto.DtoCurso;
import com.gestoracad.entity.Curso;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.mapper.MapeadorCurso;
import com.gestoracad.repository.RepositorioCurso;
import com.gestoracad.service.impl.ServicioCursoImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Pruebas unitarias del catálogo de cursos.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@ExtendWith(MockitoExtension.class)
class ServicioCursoTest {

    @Mock
    private RepositorioCurso courseRepository;

    @Mock
    private ServicioAuditoria auditService;

    private ServicioCursoImpl courseService;

    @BeforeEach
    void setUp() {
        courseService = new ServicioCursoImpl(courseRepository, new MapeadorCurso(), auditService);
    }

    private DtoCurso course(String code, String type, int theory, int practice) {
        DtoCurso dto = new DtoCurso();
        dto.setCode(code);
        dto.setName("Curso " + code);
        dto.setCredits(4);
        dto.setTheoryHours(theory);
        dto.setPracticeHours(practice);
        dto.setType(type);
        return dto;
    }

    @Test
    @DisplayName("Registra un curso y calcula las horas totales")
    void createsCourseWithDerivedTotalHours() {
        when(courseRepository.existsByCodeIgnoreCase("MAT-101")).thenReturn(false);
        when(courseRepository.save(any(Curso.class))).thenAnswer(invocation -> {
            Curso saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        DtoCurso result = courseService.createCourse(course("MAT-101", "GENERAL", 3, 2), "127.0.0.1", "JUnit");

        assertEquals("MAT-101", result.getCode());
        assertEquals(5, result.getTotalHours());
        assertTrue(result.isActive());
    }

    @Test
    @DisplayName("Rechaza códigos duplicados")
    void rejectsDuplicateCode() {
        when(courseRepository.existsByCodeIgnoreCase("MAT-101")).thenReturn(true);

        ExcepcionApi error = assertThrows(ExcepcionApi.class,
                () -> courseService.createCourse(course("MAT-101", "GENERAL", 3, 2), "127.0.0.1", "JUnit"));

        assertTrue(error.getMessage().contains("ya se encuentra registrado"));
        verify(courseRepository, never()).save(any());
    }

    @Test
    @DisplayName("Rechaza tipos de curso no soportados")
    void rejectsInvalidType() {
        ExcepcionApi error = assertThrows(ExcepcionApi.class,
                () -> courseService.createCourse(course("MAT-101", "OTRO", 3, 2), "127.0.0.1", "JUnit"));

        assertTrue(error.getMessage().contains("GENERAL"));
    }

    @Test
    @DisplayName("Rechaza cursos sin carga horaria")
    void rejectsCourseWithoutHours() {
        ExcepcionApi error = assertThrows(ExcepcionApi.class,
                () -> courseService.createCourse(course("MAT-101", "GENERAL", 0, 0), "127.0.0.1", "JUnit"));

        assertTrue(error.getMessage().contains("al menos una hora"));
    }

    @Test
    @DisplayName("Desactivar un curso aplica borrado lógico")
    void deactivatesCourse() {
        Curso entity = new Curso();
        entity.setId(1L);
        entity.setCode("MAT-101");
        entity.setActive(true);
        when(courseRepository.findById(1L)).thenReturn(Optional.of(entity));
        when(courseRepository.save(any(Curso.class))).thenAnswer(invocation -> invocation.getArgument(0));

        courseService.deleteCourse(1L, "127.0.0.1", "JUnit");

        assertFalse(entity.isActive());
        assertTrue(entity.getDeletedAt() != null);
    }
}
