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
import com.gestoracad.entity.HorarioSeccion;
import com.gestoracad.entity.Matricula;
import com.gestoracad.entity.ParametroSistema;
import com.gestoracad.entity.PlanCurso;
import com.gestoracad.entity.PlanEstudio;
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
import com.gestoracad.repository.RepositorioHorarioSeccion;
import com.gestoracad.repository.RepositorioMatricula;
import com.gestoracad.repository.RepositorioParametroSistema;
import com.gestoracad.repository.RepositorioPlanCurso;
import com.gestoracad.repository.RepositorioPlanEstudio;
import com.gestoracad.repository.RepositorioSeccion;
import com.gestoracad.repository.RepositorioUsuario;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioPortalAcademico;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Implementación de los portales de estudiante y docente.
 * Todas las consultas se acotan por la cuenta autenticada.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioPortalAcademicoImpl implements ServicioPortalAcademico {

    private static final String PARAM_MIN_GRADE = "NOTA_MINIMA_APROBATORIA";
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

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
    private final RepositorioHorarioSeccion scheduleRepository;
    private final RepositorioParametroSistema parameterRepository;
    private final RepositorioPlanEstudio planRepository;
    private final RepositorioPlanCurso planCourseRepository;

    public ServicioPortalAcademicoImpl(RepositorioUsuario userRepository,
                                       RepositorioEstudiante studentRepository,
                                       RepositorioDocente teacherRepository,
                                       RepositorioMatricula enrollmentRepository,
                                       RepositorioSeccion sectionRepository,
                                       RepositorioEvaluacion evaluationRepository,
                                       RepositorioCalificacion gradeRepository,
                                       RepositorioAsistencia attendanceRepository,
                                       RepositorioActa actaRepository,
                                       RepositorioActaDetalle actaDetailRepository,
                                       RepositorioHorarioSeccion scheduleRepository,
                                       RepositorioParametroSistema parameterRepository,
                                       RepositorioPlanEstudio planRepository,
                                       RepositorioPlanCurso planCourseRepository) {
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
        this.scheduleRepository = scheduleRepository;
        this.parameterRepository = parameterRepository;
        this.planRepository = planRepository;
        this.planCourseRepository = planCourseRepository;
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
        summary.setMinimumGrade(minimumGrade());

        for (Matricula enrollment : enrollmentRepository.findActiveByStudentId(student.getId())) {
            summary.getCourses().add(buildCourse(enrollment, student));
        }
        summary.setPlan(buildPlan(student, summary.getCourses()));
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
        course.setClassroom(section.getClassroom());
        course.setScheduleBlocks(scheduleBlocks(section.getId()));
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
            grade.setDate(evaluation.getDate());
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

    private BigDecimal minimumGrade() {
        return parameterRepository.findByKey(PARAM_MIN_GRADE)
                .map(ParametroSistema::getValue)
                .map(String::trim)
                .map(value -> {
                    try {
                        return new BigDecimal(value);
                    } catch (NumberFormatException ex) {
                        return new BigDecimal("12");
                    }
                })
                .orElse(new BigDecimal("12"));
    }

    private List<DtoPortalEstudiante.Horario> scheduleBlocks(Long sectionId) {
        return scheduleRepository.findBySectionIdAndActiveTrueOrderByDayAscStartTimeAsc(sectionId)
                .stream()
                .map(block -> {
                    DtoPortalEstudiante.Horario item = new DtoPortalEstudiante.Horario();
                    item.setDay(block.getDay());
                    item.setStartTime(block.getStartTime() == null ? null : block.getStartTime().format(TIME_FORMAT));
                    item.setEndTime(block.getEndTime() == null ? null : block.getEndTime().format(TIME_FORMAT));
                    item.setClassroom(block.getClassroom());
                    return item;
                })
                .toList();
    }

    private DtoPortalEstudiante.Plan buildPlan(Estudiante student,
                                               List<DtoPortalEstudiante.Curso> currentCourses) {
        if (student.getCareer() == null) {
            return null;
        }
        PlanEstudio plan = planRepository
                .findFirstByCareerIdAndActiveTrueOrderByIdDesc(student.getCareer().getId())
                .orElse(null);
        if (plan == null) {
            return null;
        }
        List<PlanCurso> planCourses = planCourseRepository
                .findByPlanIdAndActiveTrueOrderByCycleAscCourseCodeAsc(plan.getId());
        if (planCourses.isEmpty()) {
            return null;
        }

        Set<String> approved = new HashSet<>();
        for (Matricula enrollment : enrollmentRepository.findAllByStudentIdDetailed(student.getId())) {
            if (isApproved(enrollment, student.getId())) {
                approved.add(enrollment.getSection().getCourse().getCode());
            }
        }
        Set<String> inProgress = new HashSet<>();
        currentCourses.forEach(course -> inProgress.add(course.getCourseCode()));

        DtoPortalEstudiante.Plan result = new DtoPortalEstudiante.Plan();
        result.setCode(plan.getCode());
        result.setName(plan.getName());

        int totalCredits = 0;
        int approvedCredits = 0;
        for (PlanCurso planCourse : planCourses) {
            String courseCode = planCourse.getCourse().getCode();
            int credits = planCourse.getCourse().getCredits();
            String status = approved.contains(courseCode)
                    ? "APROBADO"
                    : inProgress.contains(courseCode) ? "EN_CURSO" : "PENDIENTE";

            DtoPortalEstudiante.PlanCourse item = new DtoPortalEstudiante.PlanCourse();
            item.setCourseCode(courseCode);
            item.setCourseName(planCourse.getCourse().getName());
            item.setCycle(planCourse.getCycle());
            item.setCredits(credits);
            item.setMandatory(planCourse.isMandatory());
            item.setStatus(status);
            result.getCourses().add(item);

            totalCredits += credits;
            if ("APROBADO".equals(status)) {
                approvedCredits += credits;
            }
        }

        result.setTotalCredits(totalCredits);
        result.setApprovedCredits(approvedCredits);
        result.setProgressPercent(totalCredits == 0
                ? 0
                : (int) Math.round(approvedCredits * 100.0 / totalCredits));
        return result;
    }

    private boolean isApproved(Matricula enrollment, Long studentId) {
        Acta acta = actaRepository.findBySectionId(enrollment.getSection().getId()).orElse(null);
        if (acta == null || !"CERRADA".equalsIgnoreCase(acta.getStatus())) {
            return false;
        }
        return actaDetailRepository.findByActaId(acta.getId()).stream()
                .anyMatch(detail -> detail.getStudent().getId().equals(studentId) && detail.isApproved());
    }

    private Usuario currentUser() {
        String username = UtilidadesSeguridad.getCurrentUsername();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Usuario", "username", username));
    }
}
