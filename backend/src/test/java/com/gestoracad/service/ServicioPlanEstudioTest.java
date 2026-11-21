package com.gestoracad.service;

import com.gestoracad.dto.DtoPlanCurso;
import com.gestoracad.dto.DtoPlanEstudio;
import com.gestoracad.entity.Carrera;
import com.gestoracad.entity.Curso;
import com.gestoracad.entity.PlanCurso;
import com.gestoracad.entity.PlanEstudio;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.mapper.MapeadorPlanCurso;
import com.gestoracad.mapper.MapeadorPlanEstudio;
import com.gestoracad.repository.RepositorioCarrera;
import com.gestoracad.repository.RepositorioCurso;
import com.gestoracad.repository.RepositorioPlanCurso;
import com.gestoracad.repository.RepositorioPlanEstudio;
import com.gestoracad.service.impl.ServicioPlanEstudioImpl;
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
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Pruebas unitarias de planes de estudio y malla curricular.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@ExtendWith(MockitoExtension.class)
class ServicioPlanEstudioTest {

    @Mock
    private RepositorioPlanEstudio planRepository;

    @Mock
    private RepositorioPlanCurso planCourseRepository;

    @Mock
    private RepositorioCarrera careerRepository;

    @Mock
    private RepositorioCurso courseRepository;

    @Mock
    private ServicioAuditoria auditService;

    private ServicioPlanEstudioImpl planService;

    @BeforeEach
    void setUp() {
        planService = new ServicioPlanEstudioImpl(planRepository, planCourseRepository, careerRepository,
                courseRepository, new MapeadorPlanEstudio(), new MapeadorPlanCurso(), auditService);
    }

    private DtoPlanEstudio planPayload(String code) {
        DtoPlanEstudio dto = new DtoPlanEstudio();
        dto.setCareerId(1L);
        dto.setCode(code);
        dto.setName("Plan " + code);
        dto.setYear(2026);
        return dto;
    }

    private Carrera career() {
        Carrera career = new Carrera();
        career.setId(1L);
        career.setName("Ingeniería de Sistemas");
        return career;
    }

    private Curso course() {
        Curso course = new Curso();
        course.setId(10L);
        course.setCode("MAT-101");
        course.setName("Matemática I");
        course.setCredits(4);
        course.setActive(true);
        return course;
    }

    @Test
    @DisplayName("Registra un plan y calcula cursos y créditos")
    void createsPlan() {
        when(planRepository.existsByCodeIgnoreCase("PLAN-01")).thenReturn(false);
        when(careerRepository.findById(1L)).thenReturn(Optional.of(career()));
        when(planRepository.save(any(PlanEstudio.class))).thenAnswer(invocation -> {
            PlanEstudio saved = invocation.getArgument(0);
            saved.setId(5L);
            return saved;
        });
        when(planCourseRepository.countByPlanIdAndActiveTrue(5L)).thenReturn(2L);
        when(planCourseRepository.sumCreditsByPlanId(5L)).thenReturn(8);

        DtoPlanEstudio result = planService.createPlan(planPayload("plan-01"), "127.0.0.1", "JUnit");

        assertEquals("PLAN-01", result.getCode());
        assertEquals(2L, result.getCourseCount());
        assertEquals(8, result.getTotalCredits());
    }

    @Test
    @DisplayName("Rechaza códigos de plan duplicados")
    void rejectsDuplicatePlan() {
        when(planRepository.existsByCodeIgnoreCase("PLAN-01")).thenReturn(true);

        ExcepcionApi error = assertThrows(ExcepcionApi.class,
                () -> planService.createPlan(planPayload("PLAN-01"), "127.0.0.1", "JUnit"));

        assertTrue(error.getMessage().contains("ya se encuentra registrado"));
        verify(planRepository, never()).save(any());
    }

    @Test
    @DisplayName("Agrega un curso a la malla y rechaza duplicados activos")
    void addsCourseAndRejectsDuplicate() {
        PlanEstudio plan = new PlanEstudio();
        plan.setId(5L);
        plan.setCode("PLAN-01");
        plan.setActive(true);
        when(planRepository.findById(5L)).thenReturn(Optional.of(plan));
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course()));
        when(planCourseRepository.findByPlanIdAndCourseId(5L, 10L)).thenReturn(Optional.empty());
        when(planCourseRepository.save(any(PlanCurso.class))).thenAnswer(invocation -> {
            PlanCurso saved = invocation.getArgument(0);
            saved.setId(7L);
            return saved;
        });

        DtoPlanCurso dto = new DtoPlanCurso();
        dto.setCourseId(10L);
        dto.setCycle(1);
        dto.setMandatory(true);

        DtoPlanCurso result = planService.addCourse(5L, dto, "127.0.0.1", "JUnit");
        assertEquals("MAT-101", result.getCourseCode());
        assertEquals(4, result.getCredits());

        PlanCurso active = new PlanCurso();
        active.setActive(true);
        when(planCourseRepository.findByPlanIdAndCourseId(5L, 10L)).thenReturn(Optional.of(active));
        assertThrows(ExcepcionApi.class, () -> planService.addCourse(5L, dto, "127.0.0.1", "JUnit"));
    }

    @Test
    @DisplayName("Retira un curso de la malla con borrado lógico")
    void removesCourse() {
        PlanCurso planCourse = new PlanCurso();
        planCourse.setId(7L);
        planCourse.setCourse(course());
        planCourse.setActive(true);
        when(planCourseRepository.findByIdAndPlanId(7L, 5L)).thenReturn(Optional.of(planCourse));
        when(planCourseRepository.save(any(PlanCurso.class))).thenAnswer(invocation -> invocation.getArgument(0));

        planService.removeCourse(5L, 7L, "127.0.0.1", "JUnit");

        assertFalse(planCourse.isActive());
        assertTrue(planCourse.getDeletedAt() != null);
    }

    @Test
    @DisplayName("No permite modificar la malla de un plan desactivado")
    void rejectsInactivePlan() {
        PlanEstudio plan = new PlanEstudio();
        plan.setId(5L);
        plan.setActive(false);
        when(planRepository.findById(5L)).thenReturn(Optional.of(plan));

        DtoPlanCurso dto = new DtoPlanCurso();
        dto.setCourseId(10L);
        dto.setCycle(1);
        assertThrows(ExcepcionApi.class, () -> planService.addCourse(5L, dto, "127.0.0.1", "JUnit"));
        verify(planCourseRepository, never()).save(any());
        verify(planCourseRepository, never()).countByPlanIdAndActiveTrue(anyLong());
    }
}
