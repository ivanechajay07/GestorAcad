package com.gestoracad.service;

import com.gestoracad.dto.DtoHorarioSeccion;
import com.gestoracad.entity.Curso;
import com.gestoracad.entity.Docente;
import com.gestoracad.entity.HorarioSeccion;
import com.gestoracad.entity.PeriodoAcademico;
import com.gestoracad.entity.Seccion;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.mapper.MapeadorHorarioSeccion;
import com.gestoracad.repository.RepositorioHorarioSeccion;
import com.gestoracad.repository.RepositorioSeccion;
import com.gestoracad.service.impl.ServicioHorarioSeccionImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Pruebas unitarias de horarios y detección de choques.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@ExtendWith(MockitoExtension.class)
class ServicioHorarioSeccionTest {

    @Mock
    private RepositorioHorarioSeccion scheduleRepository;
    @Mock
    private RepositorioSeccion sectionRepository;
    @Mock
    private ServicioAuditoria auditService;

    private ServicioHorarioSeccionImpl scheduleService;

    @BeforeEach
    void setUp() {
        scheduleService = new ServicioHorarioSeccionImpl(scheduleRepository, sectionRepository,
                new MapeadorHorarioSeccion(), auditService);
    }

    private PeriodoAcademico period() {
        PeriodoAcademico period = new PeriodoAcademico();
        period.setId(1L);
        period.setCode("2026-II");
        period.setActive(true);
        return period;
    }

    private Curso course(String code) {
        Curso course = new Curso();
        course.setId(10L);
        course.setCode(code);
        course.setName("Curso " + code);
        course.setCredits(4);
        course.setActive(true);
        return course;
    }

    private Docente teacher(Long id) {
        Docente teacher = new Docente();
        teacher.setId(id);
        teacher.setActive(true);
        return teacher;
    }

    private Seccion section(Long id, Docente teacher, String classroom) {
        Seccion section = new Seccion();
        section.setId(id);
        section.setPeriod(period());
        section.setCourse(course("MAT-101"));
        section.setTeacher(teacher);
        section.setCode("A");
        section.setCapacity(30);
        section.setClassroom(classroom);
        section.setActive(true);
        return section;
    }

    private DtoHorarioSeccion payload(String start, String end, String classroom) {
        DtoHorarioSeccion dto = new DtoHorarioSeccion();
        dto.setDay("LUNES");
        dto.setStartTime(LocalTime.parse(start));
        dto.setEndTime(LocalTime.parse(end));
        dto.setClassroom(classroom);
        return dto;
    }

    @Test
    @DisplayName("Agrega un horario válido y actualiza el resumen de la sección")
    void addsSchedule() {
        Seccion section = section(1L, teacher(1L), "A-201");
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(scheduleRepository.findBySectionIdAndActiveTrueOrderByDayAscStartTimeAsc(1L)).thenReturn(List.of());
        when(scheduleRepository.findOverlapping(1L, "LUNES", LocalTime.parse("08:00"), LocalTime.parse("10:00")))
                .thenReturn(List.of());
        when(scheduleRepository.save(any(HorarioSeccion.class))).thenAnswer(invocation -> {
            HorarioSeccion saved = invocation.getArgument(0);
            saved.setId(9L);
            return saved;
        });
        when(sectionRepository.save(any(Seccion.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DtoHorarioSeccion result = scheduleService.addSchedule(1L, payload("08:00", "10:00", "A-201"),
                "127.0.0.1", "JUnit");

        assertEquals("LUNES", result.getDay());
        assertEquals(LocalTime.parse("08:00"), result.getStartTime());
        verify(sectionRepository).save(any(Seccion.class));
    }

    @Test
    @DisplayName("Rechaza choque de docente en el mismo periodo")
    void rejectsTeacherConflict() {
        Seccion section = section(1L, teacher(1L), "A-201");
        Seccion other = section(2L, teacher(1L), "B-105");
        HorarioSeccion overlap = new HorarioSeccion();
        overlap.setSection(other);
        overlap.setDay("LUNES");
        overlap.setStartTime(LocalTime.parse("09:00"));
        overlap.setEndTime(LocalTime.parse("11:00"));

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(scheduleRepository.findBySectionIdAndActiveTrueOrderByDayAscStartTimeAsc(1L)).thenReturn(List.of());
        when(scheduleRepository.findOverlapping(1L, "LUNES", LocalTime.parse("08:00"), LocalTime.parse("10:00")))
                .thenReturn(List.of(overlap));

        ExcepcionApi error = assertThrows(ExcepcionApi.class,
                () -> scheduleService.addSchedule(1L, payload("08:00", "10:00", "A-201"), "127.0.0.1", "JUnit"));
        assertEquals(true, error.getMessage().contains("docente"));
        verify(scheduleRepository, never()).save(any());
    }

    @Test
    @DisplayName("Rechaza choque de aula en el mismo periodo")
    void rejectsClassroomConflict() {
        Seccion section = section(1L, teacher(1L), "A-201");
        Seccion other = section(2L, teacher(2L), "A-201");
        HorarioSeccion overlap = new HorarioSeccion();
        overlap.setSection(other);
        overlap.setClassroom("A-201");

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(scheduleRepository.findBySectionIdAndActiveTrueOrderByDayAscStartTimeAsc(1L)).thenReturn(List.of());
        when(scheduleRepository.findOverlapping(1L, "LUNES", LocalTime.parse("08:00"), LocalTime.parse("10:00")))
                .thenReturn(List.of(overlap));

        ExcepcionApi error = assertThrows(ExcepcionApi.class,
                () -> scheduleService.addSchedule(1L, payload("08:00", "10:00", "A-201"), "127.0.0.1", "JUnit"));
        assertEquals(true, error.getMessage().contains("aula"));
        verify(scheduleRepository, never()).save(any());
    }

    @Test
    @DisplayName("Rechaza un bloque con hora de fin anterior al inicio")
    void rejectsInvalidTime() {
        Seccion section = section(1L, teacher(1L), "A-201");
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));

        assertThrows(ExcepcionApi.class,
                () -> scheduleService.addSchedule(1L, payload("10:00", "08:00", "A-201"), "127.0.0.1", "JUnit"));
        verify(scheduleRepository, never()).save(any());
    }
}
