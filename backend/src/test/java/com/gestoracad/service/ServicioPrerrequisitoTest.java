package com.gestoracad.service;

import com.gestoracad.dto.DtoPrerrequisito;
import com.gestoracad.entity.Curso;
import com.gestoracad.entity.PrerrequisitoCurso;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.mapper.MapeadorPrerrequisito;
import com.gestoracad.repository.RepositorioCurso;
import com.gestoracad.repository.RepositorioPrerrequisitoCurso;
import com.gestoracad.service.impl.ServicioPrerrequisitoImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Pruebas unitarias de prerrequisitos.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@ExtendWith(MockitoExtension.class)
class ServicioPrerrequisitoTest {

    @Mock
    private RepositorioPrerrequisitoCurso prerequisiteRepository;
    @Mock
    private RepositorioCurso courseRepository;
    @Mock
    private ServicioAuditoria auditService;

    private ServicioPrerrequisitoImpl prerequisiteService;

    @BeforeEach
    void setUp() {
        prerequisiteService = new ServicioPrerrequisitoImpl(prerequisiteRepository, courseRepository,
                new MapeadorPrerrequisito(), auditService);
    }

    private Curso course(Long id, String code) {
        Curso course = new Curso();
        course.setId(id);
        course.setCode(code);
        course.setName("Curso " + code);
        course.setCredits(4);
        course.setActive(true);
        return course;
    }

    @Test
    @DisplayName("Agrega un prerrequisito válido")
    void addsPrerequisite() {
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course(1L, "SIS-201")));
        when(courseRepository.findById(2L)).thenReturn(Optional.of(course(2L, "MAT-101")));
        when(prerequisiteRepository.existsByCourseIdAndPrerequisiteIdAndActiveTrue(2L, 1L)).thenReturn(false);
        when(prerequisiteRepository.findByCourseIdAndPrerequisiteId(1L, 2L)).thenReturn(Optional.empty());
        when(prerequisiteRepository.save(any(PrerrequisitoCurso.class))).thenAnswer(invocation -> {
            PrerrequisitoCurso saved = invocation.getArgument(0);
            saved.setId(5L);
            return saved;
        });

        DtoPrerrequisito result = prerequisiteService.addPrerequisite(1L, 2L, "127.0.0.1", "JUnit");

        assertEquals("MAT-101", result.getPrerequisiteCode());
        assertTrue(result.isActive());
    }

    @Test
    @DisplayName("Rechaza que un curso sea prerrequisito de sí mismo")
    void rejectsSelfPrerequisite() {
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course(1L, "SIS-201")));

        assertThrows(ExcepcionApi.class,
                () -> prerequisiteService.addPrerequisite(1L, 1L, "127.0.0.1", "JUnit"));
        verify(prerequisiteRepository, never()).save(any());
    }

    @Test
    @DisplayName("Rechaza dependencias circulares directas")
    void rejectsCircularDependency() {
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course(1L, "SIS-201")));
        when(courseRepository.findById(2L)).thenReturn(Optional.of(course(2L, "MAT-101")));
        when(prerequisiteRepository.existsByCourseIdAndPrerequisiteIdAndActiveTrue(2L, 1L)).thenReturn(true);

        assertThrows(ExcepcionApi.class,
                () -> prerequisiteService.addPrerequisite(1L, 2L, "127.0.0.1", "JUnit"));
        verify(prerequisiteRepository, never()).save(any());
    }
}
