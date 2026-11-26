package com.gestoracad.service.impl;

import com.gestoracad.dto.DtoActa;
import com.gestoracad.dto.DtoAsistencia;
import com.gestoracad.dto.DtoCalificacion;
import com.gestoracad.dto.DtoEvaluacion;
import com.gestoracad.dto.DtoSeccionDocente;
import com.gestoracad.entity.Docente;
import com.gestoracad.entity.Estudiante;
import com.gestoracad.entity.Evaluacion;
import com.gestoracad.entity.Matricula;
import com.gestoracad.entity.Seccion;
import com.gestoracad.entity.Usuario;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.mapper.MapeadorAsistencia;
import com.gestoracad.repository.RepositorioAsistencia;
import com.gestoracad.repository.RepositorioDocente;
import com.gestoracad.repository.RepositorioEvaluacion;
import com.gestoracad.repository.RepositorioMatricula;
import com.gestoracad.repository.RepositorioSeccion;
import com.gestoracad.repository.RepositorioUsuario;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioEvaluacionAcademica;
import com.gestoracad.service.ServicioPortalDocente;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Portal operativo del docente con validación de propiedad por sección.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioPortalDocenteImpl implements ServicioPortalDocente {

    private final RepositorioUsuario userRepository;
    private final RepositorioDocente teacherRepository;
    private final RepositorioSeccion sectionRepository;
    private final RepositorioMatricula enrollmentRepository;
    private final RepositorioEvaluacion evaluationRepository;
    private final RepositorioAsistencia attendanceRepository;
    private final MapeadorAsistencia attendanceMapper;
    private final ServicioEvaluacionAcademica evaluationService;

    public ServicioPortalDocenteImpl(RepositorioUsuario userRepository,
                                     RepositorioDocente teacherRepository,
                                     RepositorioSeccion sectionRepository,
                                     RepositorioMatricula enrollmentRepository,
                                     RepositorioEvaluacion evaluationRepository,
                                     RepositorioAsistencia attendanceRepository,
                                     MapeadorAsistencia attendanceMapper,
                                     ServicioEvaluacionAcademica evaluationService) {
        this.userRepository = userRepository;
        this.teacherRepository = teacherRepository;
        this.sectionRepository = sectionRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.evaluationRepository = evaluationRepository;
        this.attendanceRepository = attendanceRepository;
        this.attendanceMapper = attendanceMapper;
        this.evaluationService = evaluationService;
    }

    @Override
    @Transactional(readOnly = true)
    public DtoSeccionDocente getSection(Long sectionId) {
        Seccion section = ownedSection(sectionId);
        DtoSeccionDocente dto = new DtoSeccionDocente();
        dto.setId(section.getId());
        dto.setPeriodCode(section.getPeriod().getCode());
        dto.setCourseCode(section.getCourse().getCode());
        dto.setCourseName(section.getCourse().getName());
        dto.setSectionCode(section.getCode());
        dto.setSchedule(section.getSchedule());
        for (Matricula enrollment : enrollmentRepository.findActiveBySectionId(sectionId)) {
            Estudiante student = enrollment.getStudent();
            DtoSeccionDocente.Alumno item = new DtoSeccionDocente.Alumno();
            item.setId(student.getId());
            item.setCode(student.getCode());
            item.setName((student.getFirstName() + " " + student.getLastName()).trim());
            dto.getStudents().add(item);
        }
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoEvaluacion> getEvaluations(Long sectionId) {
        ownedSection(sectionId);
        return evaluationService.getEvaluations(sectionId);
    }

    @Override
    @Transactional
    public DtoEvaluacion createEvaluation(Long sectionId, DtoEvaluacion dto,
                                          String clientIp, String userAgent) {
        ownedSection(sectionId);
        dto.setSectionId(sectionId);
        dto.setActive(true);
        return evaluationService.createEvaluation(sectionId, dto, clientIp, userAgent);
    }

    @Override
    @Transactional
    public DtoEvaluacion updateEvaluation(Long evaluationId, DtoEvaluacion dto,
                                          String clientIp, String userAgent) {
        Evaluacion evaluation = ownedEvaluation(evaluationId);
        dto.setSectionId(evaluation.getSection().getId());
        dto.setActive(true);
        return evaluationService.updateEvaluation(evaluationId, dto, clientIp, userAgent);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoCalificacion> getGrades(Long evaluationId) {
        ownedEvaluation(evaluationId);
        return evaluationService.getGrades(evaluationId);
    }

    @Override
    @Transactional
    public void saveGrades(Long evaluationId, List<DtoCalificacion> grades, String clientIp, String userAgent) {
        ownedEvaluation(evaluationId);
        evaluationService.saveGrades(evaluationId, grades, clientIp, userAgent);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoAsistencia> getAttendance(Long sectionId, LocalDate date) {
        ownedSection(sectionId);
        return evaluationService.getAttendance(sectionId, date);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoAsistencia> getAttendanceHistory(Long sectionId) {
        ownedSection(sectionId);
        return attendanceRepository.findBySectionIdAndActiveTrueOrderByDateDesc(sectionId)
                .stream()
                .map(attendanceMapper::toDto)
                .toList();
    }

    @Override
    @Transactional
    public void saveAttendance(Long sectionId, LocalDate date, List<DtoAsistencia> attendance,
                               String clientIp, String userAgent) {
        ownedSection(sectionId);
        evaluationService.saveAttendance(sectionId, date, attendance, clientIp, userAgent);
    }

    @Override
    @Transactional(readOnly = true)
    public DtoActa getActa(Long sectionId) {
        ownedSection(sectionId);
        return evaluationService.getActa(sectionId);
    }

    @Override
    @Transactional
    public DtoActa closeActa(Long sectionId, String clientIp, String userAgent) {
        ownedSection(sectionId);
        return evaluationService.closeActa(sectionId, clientIp, userAgent);
    }

    private Docente currentTeacher() {
        String username = UtilidadesSeguridad.getCurrentUsername();
        Usuario user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Usuario", "username", username));
        return teacherRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ExcepcionApi(
                        "La cuenta no tiene una ficha de docente vinculada", HttpStatus.FORBIDDEN));
    }

    private Seccion ownedSection(Long sectionId) {
        Seccion section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Sección", "id", sectionId));
        Docente teacher = currentTeacher();
        if (section.getTeacher() == null || !section.getTeacher().getId().equals(teacher.getId())) {
            throw new ExcepcionApi("No tienes acceso a una sección que no está asignada a tu cuenta",
                    HttpStatus.FORBIDDEN);
        }
        return section;
    }

    private Evaluacion ownedEvaluation(Long evaluationId) {
        Evaluacion evaluation = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Evaluación", "id", evaluationId));
        ownedSection(evaluation.getSection().getId());
        return evaluation;
    }
}
