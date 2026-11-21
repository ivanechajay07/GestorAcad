package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoAsignacionDocente;
import com.gestoracad.entity.Docente;
import com.gestoracad.entity.AsignacionDocente;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.mapper.MapeadorAsignacionDocente;
import com.gestoracad.repository.RepositorioAsignacionDocente;
import com.gestoracad.repository.RepositorioDocente;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioAsignacionDocente;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementación del servicio de gestión de asignaciones docentes.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioAsignacionDocenteImpl implements ServicioAsignacionDocente {

    private static final String MODULE = "ASIGNACION";
    private static final String BASE_ENDPOINT = "/api/v1/teacher-assignments";

    private final RepositorioAsignacionDocente assignmentRepository;
    private final RepositorioDocente teacherRepository;
    private final MapeadorAsignacionDocente assignmentMapper;
    private final ServicioAuditoria auditService;

    public ServicioAsignacionDocenteImpl(RepositorioAsignacionDocente assignmentRepository,
                                        RepositorioDocente teacherRepository,
                                        MapeadorAsignacionDocente assignmentMapper,
                                        ServicioAuditoria auditService) {
        this.assignmentRepository = assignmentRepository;
        this.teacherRepository = teacherRepository;
        this.assignmentMapper = assignmentMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoAsignacionDocente> getAssignmentsByTeacher(Long teacherId) {
        return assignmentRepository.findByTeacherIdOrderByPeriodDescCourseAsc(teacherId)
                .stream()
                .map(assignmentMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DtoAsignacionDocente getAssignmentById(Long id) {
        return assignmentRepository.findById(id)
                .map(assignmentMapper::toDto)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Asignación lectiva", "id", id));
    }

    @Override
    @Transactional
    public DtoAsignacionDocente createAssignment(Long teacherId, DtoAsignacionDocente dto, String clientIp, String userAgent) {
        Docente teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Docente", "id", teacherId));

        String courseCode = normalize(dto.getCourseCode());
        if (courseCode != null
                && assignmentRepository.existsByTeacherIdAndPeriodAndCourseCode(teacherId, dto.getPeriod().trim(), courseCode)) {
            auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                    "Intento fallido de registrar asignación duplicada: " + courseCode + " (" + dto.getPeriod() + ")",
                    BASE_ENDPOINT, "POST", clientIp, "FAILURE", userAgent, "tb_docente_asignaciones", null);
            throw new ExcepcionApi("El docente ya tiene asignado el curso '" + courseCode
                    + "' en el periodo '" + dto.getPeriod() + "'");
        }

        AsignacionDocente entity = new AsignacionDocente();
        assignmentMapper.updateEntity(entity, dto);
        entity.setPeriod(dto.getPeriod().trim());
        entity.setCourseCode(courseCode);
        entity.setTeacher(teacher);
        entity.setActive(true);

        AsignacionDocente saved = assignmentRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                "Asignación lectiva registrada: " + saved.getCourse() + " (" + saved.getPeriod() + ") para "
                        + teacher.getFirstName() + " " + teacher.getLastName(),
                BASE_ENDPOINT, "POST", clientIp, "SUCCESS", userAgent, "tb_docente_asignaciones", saved.getId());

        return assignmentMapper.toDto(saved);
    }

    @Override
    @Transactional
    public DtoAsignacionDocente updateAssignment(Long id, DtoAsignacionDocente dto, String clientIp, String userAgent) {
        AsignacionDocente entity = assignmentRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Asignación lectiva", "id", id));

        assignmentMapper.updateEntity(entity, dto);
        entity.setPeriod(dto.getPeriod().trim());
        entity.setCourseCode(normalize(dto.getCourseCode()));

        AsignacionDocente saved = assignmentRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                "Asignación lectiva actualizada: " + saved.getCourse() + " (" + saved.getPeriod() + ")",
                BASE_ENDPOINT + "/" + id, "PUT", clientIp, "SUCCESS", userAgent, "tb_docente_asignaciones", saved.getId());

        return assignmentMapper.toDto(saved);
    }

    @Override
    @Transactional
    public void deleteAssignment(Long id, String clientIp, String userAgent) {
        AsignacionDocente entity = assignmentRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Asignación lectiva", "id", id));

        entity.setActive(false);
        entity.setDeletedAt(LocalDateTime.now());
        assignmentRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, MODULE,
                "Asignación lectiva eliminada: " + entity.getCourse() + " (" + entity.getPeriod() + ")",
                BASE_ENDPOINT + "/" + id, "DELETE", clientIp, "SUCCESS", userAgent, "tb_docente_asignaciones", id);
    }

    private String normalize(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
