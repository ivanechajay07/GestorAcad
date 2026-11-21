package com.gestoracad.service;

import com.gestoracad.dto.DtoCalificacion;
import com.gestoracad.dto.DtoEvaluacion;
import com.gestoracad.entity.Acta;
import com.gestoracad.entity.ActaDetalle;
import com.gestoracad.entity.Calificacion;
import com.gestoracad.entity.Curso;
import com.gestoracad.entity.Estudiante;
import com.gestoracad.entity.Evaluacion;
import com.gestoracad.entity.Matricula;
import com.gestoracad.entity.ParametroSistema;
import com.gestoracad.entity.Seccion;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.mapper.MapeadorAsistencia;
import com.gestoracad.mapper.MapeadorCalificacion;
import com.gestoracad.mapper.MapeadorEvaluacion;
import com.gestoracad.repository.RepositorioActa;
import com.gestoracad.repository.RepositorioActaDetalle;
import com.gestoracad.repository.RepositorioAsistencia;
import com.gestoracad.repository.RepositorioCalificacion;
import com.gestoracad.repository.RepositorioEstudiante;
import com.gestoracad.repository.RepositorioEvaluacion;
import com.gestoracad.repository.RepositorioMatricula;
import com.gestoracad.repository.RepositorioParametroSistema;
import com.gestoracad.repository.RepositorioSeccion;
import com.gestoracad.service.impl.ServicioEvaluacionAcademicaImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
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
 * Pruebas unitarias del ciclo de evaluación y cierre de acta.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@ExtendWith(MockitoExtension.class)
class ServicioEvaluacionAcademicaTest {

    @Mock private RepositorioSeccion sectionRepository;
    @Mock private RepositorioMatricula enrollmentRepository;
    @Mock private RepositorioEvaluacion evaluationRepository;
    @Mock private RepositorioCalificacion gradeRepository;
    @Mock private RepositorioAsistencia attendanceRepository;
    @Mock private RepositorioActa actaRepository;
    @Mock private RepositorioActaDetalle actaDetailRepository;
    @Mock private RepositorioEstudiante studentRepository;
    @Mock private RepositorioParametroSistema parameterRepository;
    @Mock private ServicioAuditoria auditService;

    private ServicioEvaluacionAcademicaImpl service;

    @BeforeEach
    void setUp() {
        service = new ServicioEvaluacionAcademicaImpl(sectionRepository, enrollmentRepository, evaluationRepository,
                gradeRepository, attendanceRepository, actaRepository, actaDetailRepository, studentRepository,
                parameterRepository, new MapeadorEvaluacion(), new MapeadorCalificacion(),
                new MapeadorAsistencia(), auditService);
    }

    private Curso course() {
        Curso course = new Curso();
        course.setId(1L);
        course.setCode("MAT-101");
        course.setName("Matemática I");
        course.setCredits(4);
        course.setActive(true);
        return course;
    }

    private Seccion section() {
        Seccion section = new Seccion();
        section.setId(1L);
        section.setCourse(course());
        section.setCode("A");
        section.setCapacity(30);
        section.setActive(true);
        return section;
    }

    private Estudiante student() {
        Estudiante student = new Estudiante();
        student.setId(1L);
        student.setCode("2023-010482");
        student.setFirstName("Lucía");
        student.setLastName("Vega");
        student.setApprovedCredits(0);
        student.setActive(true);
        return student;
    }

    private Evaluacion evaluation(String weight) {
        Evaluacion evaluation = new Evaluacion();
        evaluation.setId(2L);
        evaluation.setSection(section());
        evaluation.setName("Examen final");
        evaluation.setType("FINAL");
        evaluation.setWeight(new BigDecimal(weight));
        evaluation.setMaxScore(new BigDecimal("20"));
        evaluation.setActive(true);
        return evaluation;
    }

    private DtoEvaluacion payload(BigDecimal weight) {
        DtoEvaluacion dto = new DtoEvaluacion();
        dto.setName("Examen final");
        dto.setType("FINAL");
        dto.setWeight(weight);
        dto.setMaxScore(new BigDecimal("20"));
        return dto;
    }

    @Test
    @DisplayName("Rechaza evaluaciones que superan el 100 % de peso")
    void rejectsWeightOverflow() {
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section()));
        when(actaRepository.findBySectionId(1L)).thenReturn(Optional.empty());
        when(evaluationRepository.existsBySectionIdAndNameIgnoreCase(1L, "Examen final")).thenReturn(false);
        when(evaluationRepository.sumWeightBySectionId(1L)).thenReturn(new BigDecimal("90"));

        assertThrows(ExcepcionApi.class,
                () -> service.createEvaluation(1L, payload(new BigDecimal("20")), "127.0.0.1", "JUnit"));
        verify(evaluationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Rechaza notas fuera de la escala de la evaluación")
    void rejectsGradeAboveMax() {
        Seccion section = section();
        Evaluacion evaluation = evaluation("100");
        when(evaluationRepository.findById(2L)).thenReturn(Optional.of(evaluation));
        when(actaRepository.findBySectionId(1L)).thenReturn(Optional.empty());
        when(enrollmentRepository.findActiveBySectionId(1L)).thenReturn(List.of());
        DtoCalificacion grade = new DtoCalificacion();
        grade.setStudentId(1L);
        grade.setScore(new BigDecimal("25"));

        assertThrows(ExcepcionApi.class,
                () -> service.saveGrades(2L, List.of(grade), "127.0.0.1", "JUnit"));
        verify(gradeRepository, never()).save(any());
    }

    @Test
    @DisplayName("No permite modificar notas de un acta cerrada")
    void rejectsChangesOnClosedAct() {
        Evaluacion evaluation = evaluation("100");
        Acta acta = new Acta();
        acta.setStatus("CERRADA");
        when(evaluationRepository.findById(2L)).thenReturn(Optional.of(evaluation));
        when(actaRepository.findBySectionId(1L)).thenReturn(Optional.of(acta));

        DtoCalificacion grade = new DtoCalificacion();
        grade.setStudentId(1L);
        grade.setScore(new BigDecimal("15"));
        assertThrows(ExcepcionApi.class,
                () -> service.saveGrades(2L, List.of(grade), "127.0.0.1", "JUnit"));
        verify(gradeRepository, never()).save(any());
    }

    @Test
    @DisplayName("No cierra el acta si los pesos no suman 100")
    void rejectsCloseWithWrongWeights() {
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section()));
        when(actaRepository.findBySectionId(1L)).thenReturn(Optional.empty());
        when(evaluationRepository.findBySectionIdAndActiveTrueOrderByDateAscIdAsc(1L))
                .thenReturn(List.of(evaluation("90")));
        when(evaluationRepository.sumWeightBySectionId(1L)).thenReturn(new BigDecimal("90"));

        assertThrows(ExcepcionApi.class,
                () -> service.closeActa(1L, "127.0.0.1", "JUnit"));
        verify(actaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Cierra el acta, calcula promedio y suma créditos aprobados")
    void closesActAndCalculatesAverage() {
        Seccion section = section();
        Estudiante student = student();
        Evaluacion evaluation = evaluation("100");
        Calificacion grade = new Calificacion();
        grade.setEvaluation(evaluation);
        grade.setStudent(student);
        grade.setScore(new BigDecimal("15"));
        grade.setActive(true);
        Matricula enrollment = new Matricula();
        enrollment.setStudent(student);
        enrollment.setSection(section);
        enrollment.setActive(true);
        ParametroSistema min = new ParametroSistema();
        min.setKey("NOTA_MINIMA_APROBATORIA");
        min.setValue("11");

        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(actaRepository.findBySectionId(1L)).thenReturn(Optional.empty());
        when(evaluationRepository.findBySectionIdAndActiveTrueOrderByDateAscIdAsc(1L)).thenReturn(List.of(evaluation));
        when(evaluationRepository.sumWeightBySectionId(1L)).thenReturn(new BigDecimal("100"));
        when(enrollmentRepository.findActiveBySectionId(1L)).thenReturn(List.of(enrollment));
        when(gradeRepository.findActiveBySectionId(1L)).thenReturn(List.of(grade));
        when(parameterRepository.findByKey("NOTA_MINIMA_APROBATORIA")).thenReturn(Optional.of(min));
        when(actaRepository.save(any(Acta.class))).thenAnswer(invocation -> {
            Acta saved = invocation.getArgument(0);
            saved.setId(5L);
            return saved;
        });
        when(actaDetailRepository.save(any(ActaDetalle.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(actaDetailRepository.findByActaId(5L)).thenReturn(List.of());
        when(studentRepository.save(any(Estudiante.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.closeActa(1L, "127.0.0.1", "JUnit");

        ArgumentCaptor<ActaDetalle> detail = ArgumentCaptor.forClass(ActaDetalle.class);
        verify(actaDetailRepository).save(detail.capture());
        assertEquals(new BigDecimal("15.00"), detail.getValue().getAverage());
        assertTrue(detail.getValue().isApproved());
        assertEquals(4, student.getApprovedCredits());
    }
}
