package com.gestoracad.service;

import com.gestoracad.dto.DtoMatricula;
import com.gestoracad.entity.Curso;
import com.gestoracad.entity.Estudiante;
import com.gestoracad.entity.Matricula;
import com.gestoracad.entity.ParametroSistema;
import com.gestoracad.entity.PeriodoAcademico;
import com.gestoracad.entity.PrerrequisitoCurso;
import com.gestoracad.entity.Seccion;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.mapper.MapeadorMatricula;
import com.gestoracad.repository.RepositorioActaDetalle;
import com.gestoracad.repository.RepositorioEstudiante;
import com.gestoracad.repository.RepositorioMatricula;
import com.gestoracad.repository.RepositorioParametroSistema;
import com.gestoracad.repository.RepositorioPrerrequisitoCurso;
import com.gestoracad.repository.RepositorioSeccion;
import com.gestoracad.service.impl.ServicioMatriculaImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Pruebas unitarias de matrícula: cupo, créditos y duplicidades.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@ExtendWith(MockitoExtension.class)
class ServicioMatriculaTest {

    @Mock
    private RepositorioMatricula enrollmentRepository;
    @Mock
    private RepositorioEstudiante studentRepository;
    @Mock
    private RepositorioSeccion sectionRepository;
    @Mock
    private RepositorioParametroSistema parameterRepository;
    @Mock
    private RepositorioPrerrequisitoCurso prerequisiteRepository;
    @Mock
    private RepositorioActaDetalle actaDetailRepository;
    @Mock
    private ServicioAuditoria auditService;

    private ServicioMatriculaImpl enrollmentService;

    @BeforeEach
    void setUp() {
        enrollmentService = new ServicioMatriculaImpl(enrollmentRepository, studentRepository, sectionRepository,
                parameterRepository, prerequisiteRepository, actaDetailRepository,
                new MapeadorMatricula(), auditService);
    }

    private PeriodoAcademico period(LocalDate start, LocalDate end) {
        PeriodoAcademico period = new PeriodoAcademico();
        period.setId(1L);
        period.setCode("2026-II");
        period.setName("Periodo 2026-II");
        period.setStartDate(LocalDate.of(2026, 8, 10));
        period.setEndDate(LocalDate.of(2026, 12, 18));
        period.setEnrollmentStart(start);
        period.setEnrollmentEnd(end);
        period.setActive(true);
        return period;
    }

    private Estudiante student() {
        Estudiante student = new Estudiante();
        student.setId(1L);
        student.setCode("2023-010482");
        student.setFirstName("Lucía");
        student.setLastName("Vega");
        student.setActive(true);
        return student;
    }

    private Seccion section(PeriodoAcademico period, int capacity) {
        Curso course = new Curso();
        course.setId(2L);
        course.setCode("MAT-101");
        course.setName("Matemática I");
        course.setCredits(4);
        course.setActive(true);

        Seccion section = new Seccion();
        section.setId(3L);
        section.setPeriod(period);
        section.setCourse(course);
        section.setCode("A");
        section.setCapacity(capacity);
        section.setActive(true);
        return section;
    }

    private DtoMatricula payload() {
        DtoMatricula dto = new DtoMatricula();
        dto.setStudentId(1L);
        dto.setSectionId(3L);
        return dto;
    }

    private ParametroSistema parameter(String key, String value) {
        ParametroSistema parameter = new ParametroSistema();
        parameter.setKey(key);
        parameter.setValue(value);
        return parameter;
    }

    @Test
    @DisplayName("Registra una matrícula cuando hay cupo y créditos disponibles")
    void createsEnrollment() {
        PeriodoAcademico period = period(null, null);
        Seccion section = section(period, 30);
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student()));
        when(sectionRepository.findById(3L)).thenReturn(Optional.of(section));
        when(enrollmentRepository.findByStudentIdAndSectionId(1L, 3L)).thenReturn(Optional.empty());
        when(enrollmentRepository.countActiveByStudentCoursePeriod(1L, 2L, 1L)).thenReturn(0L);
        when(enrollmentRepository.countActiveBySectionId(3L)).thenReturn(0L);
        when(parameterRepository.findByKey("MAX_CREDITOS_POR_PERIODO"))
                .thenReturn(Optional.of(parameter("MAX_CREDITOS_POR_PERIODO", "22")));
        when(enrollmentRepository.sumActiveCreditsByStudentPeriod(1L, 1L)).thenReturn(0);
        when(enrollmentRepository.save(any(Matricula.class))).thenAnswer(invocation -> {
            Matricula saved = invocation.getArgument(0);
            saved.setId(8L);
            return saved;
        });

        DtoMatricula result = enrollmentService.createEnrollment(payload(), "127.0.0.1", "JUnit");

        assertEquals("2023-010482", result.getStudentCode());
        assertEquals("MAT-101", result.getCourseCode());
        assertEquals(4, result.getCredits());
        assertTrue(result.isActive());
    }

    @Test
    @DisplayName("Rechaza una matrícula duplicada en la misma sección")
    void rejectsDuplicateSection() {
        Seccion section = section(period(null, null), 30);
        Matricula existing = new Matricula();
        existing.setId(8L);
        existing.setActive(true);
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student()));
        when(sectionRepository.findById(3L)).thenReturn(Optional.of(section));
        when(enrollmentRepository.findByStudentIdAndSectionId(1L, 3L)).thenReturn(Optional.of(existing));

        assertThrows(ExcepcionApi.class, () -> enrollmentService.createEnrollment(payload(), "127.0.0.1", "JUnit"));
        verify(enrollmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Rechaza una matrícula cuando la sección está llena")
    void rejectsFullSection() {
        Seccion section = section(period(null, null), 2);
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student()));
        when(sectionRepository.findById(3L)).thenReturn(Optional.of(section));
        when(enrollmentRepository.findByStudentIdAndSectionId(1L, 3L)).thenReturn(Optional.empty());
        when(enrollmentRepository.countActiveByStudentCoursePeriod(1L, 2L, 1L)).thenReturn(0L);
        when(enrollmentRepository.countActiveBySectionId(3L)).thenReturn(2L);

        assertThrows(ExcepcionApi.class, () -> enrollmentService.createEnrollment(payload(), "127.0.0.1", "JUnit"));
    }

    @Test
    @DisplayName("Rechaza la matrícula si supera el máximo de créditos")
    void rejectsCreditOverflow() {
        Seccion section = section(period(null, null), 30);
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student()));
        when(sectionRepository.findById(3L)).thenReturn(Optional.of(section));
        when(enrollmentRepository.findByStudentIdAndSectionId(1L, 3L)).thenReturn(Optional.empty());
        when(enrollmentRepository.countActiveByStudentCoursePeriod(1L, 2L, 1L)).thenReturn(0L);
        when(enrollmentRepository.countActiveBySectionId(3L)).thenReturn(0L);
        when(parameterRepository.findByKey("MAX_CREDITOS_POR_PERIODO"))
                .thenReturn(Optional.of(parameter("MAX_CREDITOS_POR_PERIODO", "22")));
        when(enrollmentRepository.sumActiveCreditsByStudentPeriod(1L, 1L)).thenReturn(20);

        assertThrows(ExcepcionApi.class, () -> enrollmentService.createEnrollment(payload(), "127.0.0.1", "JUnit"));
    }

    @Test
    @DisplayName("Rechaza matricular dos veces el mismo curso en el periodo")
    void rejectsDuplicateCourse() {
        Seccion section = section(period(null, null), 30);
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student()));
        when(sectionRepository.findById(3L)).thenReturn(Optional.of(section));
        when(enrollmentRepository.findByStudentIdAndSectionId(1L, 3L)).thenReturn(Optional.empty());
        when(enrollmentRepository.countActiveByStudentCoursePeriod(1L, 2L, 1L)).thenReturn(1L);

        assertThrows(ExcepcionApi.class, () -> enrollmentService.createEnrollment(payload(), "127.0.0.1", "JUnit"));
    }

    @Test
    @DisplayName("Rechaza la matrícula si el prerrequisito no está aprobado en acta cerrada")
    void rejectsMissingPrerequisite() {
        Seccion section = section(period(null, null), 30);
        Curso prerequisite = new Curso();
        prerequisite.setId(9L);
        prerequisite.setCode("MAT-100");
        prerequisite.setName("Matemática Básica");
        PrerrequisitoCurso link = new PrerrequisitoCurso();
        link.setCourse(section.getCourse());
        link.setPrerequisite(prerequisite);

        when(studentRepository.findById(1L)).thenReturn(Optional.of(student()));
        when(sectionRepository.findById(3L)).thenReturn(Optional.of(section));
        when(enrollmentRepository.findByStudentIdAndSectionId(1L, 3L)).thenReturn(Optional.empty());
        when(prerequisiteRepository.findByCourseIdAndActiveTrue(2L)).thenReturn(List.of(link));
        when(actaDetailRepository.countApprovedByStudentAndCourse(1L, 9L)).thenReturn(0L);

        ExcepcionApi error = assertThrows(ExcepcionApi.class,
                () -> enrollmentService.createEnrollment(payload(), "127.0.0.1", "JUnit"));
        assertTrue(error.getMessage().contains("MAT-100"));
        verify(enrollmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Rechaza matrícula fuera de ventana sin autorización extemporánea")
    void rejectsOutsideWindowWithoutExtension() {
        PeriodoAcademico period = period(LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31));
        Seccion section = section(period, 30);
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student()));
        when(sectionRepository.findById(3L)).thenReturn(Optional.of(section));
        when(enrollmentRepository.findByStudentIdAndSectionId(1L, 3L)).thenReturn(Optional.empty());
        when(parameterRepository.findByKey("PERMITE_MATRICULA_EXTEMPORANEA"))
                .thenReturn(Optional.of(parameter("PERMITE_MATRICULA_EXTEMPORANEA", "false")));

        assertThrows(ExcepcionApi.class, () -> enrollmentService.createEnrollment(payload(), "127.0.0.1", "JUnit"));
    }
}
