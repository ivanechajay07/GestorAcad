package com.gestoracad.service.impl;

import com.gestoracad.dto.DtoPortalDocente;
import com.gestoracad.dto.DtoPortalEstudiante;
import com.gestoracad.entity.Acta;
import com.gestoracad.entity.ActaDetalle;
import com.gestoracad.entity.Asistencia;
import com.gestoracad.entity.Calificacion;
import com.gestoracad.entity.Docente;
import com.gestoracad.entity.Estudiante;
import com.gestoracad.entity.Evaluacion;
import com.gestoracad.entity.Matricula;
import com.gestoracad.entity.Seccion;
import com.gestoracad.entity.Usuario;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.repository.RepositorioActa;
import com.gestoracad.repository.RepositorioActaDetalle;
import com.gestoracad.repository.RepositorioAsistencia;
import com.gestoracad.repository.RepositorioCalificacion;
import com.gestoracad.repository.RepositorioDocente;
import com.gestoracad.repository.RepositorioEstudiante;
import com.gestoracad.repository.RepositorioEvaluacion;
import com.gestoracad.repository.RepositorioMatricula;
import com.gestoracad.repository.RepositorioSeccion;
import com.gestoracad.repository.RepositorioUsuario;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioPortalAcademico;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Implementación de los portales de estudiante y docente.
 * Todas las consultas se acotan por la cuenta autenticada.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioPortalAcademicoImpl implements ServicioPortalAcademico {

    private final RepositorioUsuario userRepository;
    private final RepositorioEstudiante studentRepository;
    private final RepositorioDocente teacherRepository;
    private final RepositorioMatricula enrollmentRepository;
    private final RepositorioSeccion sectionRepository;
    private final RepositorioEvaluacion evaluationRepository;
    private final RepositorioCalificacion gradeRepository;
    private final RepositorioAsistencia attendanceRepository;
    private final RepositorioActa actaRepository;
    private final RepositorioActaDetalle actaDetailRepository;

    public ServicioPortalAcademicoImpl(RepositorioUsuario userRepository,
                                       RepositorioEstudiante studentRepository,
                                       RepositorioDocente teacherRepository,
                                       RepositorioMatricula enrollmentRepository,
                                       RepositorioSeccion sectionRepository,
                                       RepositorioEvaluacion evaluationRepository,
                                       RepositorioCalificacion gradeRepository,
                                       RepositorioAsistencia attendanceRepository,
                                       RepositorioActa actaRepository,
                                       RepositorioActaDetalle actaDetailRepository) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.sectionRepository = sectionRepository;
        this.evaluationRepository = evaluationRepository;
        this.gradeRepository = gradeRepository;
        this.attendanceRepository = attendanceRepository;
        this.actaRepository = actaRepository;
        this.actaDetailRepository = actaDetailRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public DtoPortalEstudiante getStudentSummary() {
        Usuario user = currentUser();
        Estudiante student = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado(
                        "Ficha de estudiante", "usuario", user.getUsername()));

        DtoPortalEstudiante summary = new DtoPortalEstudiante();
        summary.setCode(student.getCode());
        summary.setFirstName(student.getFirstName());
        summary.setLastName(student.getLastName());
        summary.setCareer(student.getCareer() == null ? null : student.getCareer().getName());
        summary.setFaculty(student.getFaculty() == null ? null : student.getFaculty().getName());
        summary.setCurrentCycle(student.getCurrentCycle());
        summary.setApprovedCredits(student.getApprovedCredits());
        summary.setWeightedAverage(student.getWeightedAverage());
        summary.setCondition(student.getCondition());

        for (Matricula enrollment : enrollmentRepository.findActiveByStudentId(student.getId())) {
            summary.getCourses().add(buildCourse(enrollment, student));
        }
        return summary;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoPortalEstudiante.Curso> getStudentHistory() {
        Usuario user = currentUser();
        Estudiante student = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado(
                        "Ficha de estudiante", "usuario", user.getUsername()));
        return enrollmentRepository.findAllByStudentIdDetailed(student.getId())
                .stream()
                .map(enrollment -> buildCourse(enrollment, student))
                .toList();
    }

    private DtoPortalEstudiante.Curso buildCourse(Matricula enrollment, Estudiante student) {
        Seccion section = enrollment.getSection();
        DtoPortalEstudiante.Curso course = new DtoPortalEstudiante.Curso();
        course.setPeriodCode(section.getPeriod().getCode());
        course.setCourseCode(section.getCourse().getCode());
        course.setCourseName(section.getCourse().getName());
        course.setSectionCode(section.getCode());
        course.setSectionId(section.getId());
        course.setSchedule(section.getSchedule());
        Docente teacher = section.getTeacher();
        if (teacher != null) {
            String firstName = teacher.getFirstName() == null ? "" : teacher.getFirstName();
            String lastName = teacher.getLastName() == null ? "" : teacher.getLastName();
            course.setTeacherName((firstName + " " + lastName).trim());
        }
        course.setCredits(section.getCourse().getCredits());
        course.setStatus(enrollment.getStatus());
        course.setEnrollmentDate(enrollment.getEnrollmentDate());

        for (Evaluacion evaluation : evaluationRepository
                .findBySectionIdAndActiveTrueOrderByDateAscIdAsc(section.getId())) {
            DtoPortalEstudiante.Nota grade = new DtoPortalEstudiante.Nota();
            grade.setEvaluationName(evaluation.getName());
            grade.setType(evaluation.getType());
            grade.setWeight(evaluation.getWeight());
            grade.setMaxScore(evaluation.getMaxScore());
            grade.setScore(gradeRepository
                    .findByEvaluationIdAndStudentId(evaluation.getId(), student.getId())
                    .map(Calificacion::getScore)
                    .orElse(null));
            course.getGrades().add(grade);
        }

        long present = 0;
        long absent = 0;
        long late = 0;
        for (Asistencia attendance : attendanceRepository
                .findBySectionIdAndStudentIdAndActiveTrue(section.getId(), student.getId())) {
            switch (attendance.getStatus()) {
                case "AUSENTE" -> absent++;
                case "TARDANZA" -> late++;
                case "JUSTIFICADO", "PRESENTE" -> present++;
                default -> { }
            }
        }
        course.setPresent(present);
        course.setAbsent(absent);
        course.setLate(late);

        Acta acta = actaRepository.findBySectionId(section.getId()).orElse(null);
        course.setActaStatus(acta == null ? "ABIERTA" : acta.getStatus());
        if (acta != null) {
            for (ActaDetalle detail : actaDetailRepository.findByActaId(acta.getId())) {
                if (detail.getStudent().getId().equals(student.getId())) {
                    course.setAverage(detail.getAverage());
                    course.setApproved(detail.isApproved());
                    break;
                }
            }
        }
        return course;
    }

    @Override
    @Transactional(readOnly = true)
    public DtoPortalDocente getTeacherSummary() {
        Usuario user = currentUser();
        Docente teacher = teacherRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado(
                        "Ficha de docente", "usuario", user.getUsername()));

        DtoPortalDocente summary = new DtoPortalDocente();
        summary.setCode(teacher.getCode());
        summary.setName((teacher.getFirstName() + " " + teacher.getLastName()).trim());
        summary.setFaculty(teacher.getFaculty() == null ? null : teacher.getFaculty().getName());

        for (Seccion section : sectionRepository.findByTeacherIdDetailed(teacher.getId())) {
            DtoPortalDocente.Seccion item = new DtoPortalDocente.Seccion();
            item.setId(section.getId());
            item.setPeriodCode(section.getPeriod().getCode());
            item.setCourseCode(section.getCourse().getCode());
            item.setCourseName(section.getCourse().getName());
            item.setSectionCode(section.getCode());
            item.setStudents(enrollmentRepository.countActiveBySectionId(section.getId()));
            item.setEvaluations(evaluationRepository
                    .findBySectionIdAndActiveTrueOrderByDateAscIdAsc(section.getId()).size());
            item.setActaStatus(actaRepository.findBySectionId(section.getId())
                    .map(Acta::getStatus)
                    .orElse("ABIERTA"));
            item.setSchedule(section.getSchedule());
            summary.getSections().add(item);
        }
        return summary;
    }

    private Usuario currentUser() {
        String username = UtilidadesSeguridad.getCurrentUsername();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Usuario", "username", username));
    }
}
