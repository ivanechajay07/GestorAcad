package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoAdmisionEstudiante;
import com.gestoracad.entity.Estudiante;
import com.gestoracad.entity.AdmisionEstudiante;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.mapper.MapeadorAdmisionEstudiante;
import com.gestoracad.repository.RepositorioAdmisionEstudiante;
import com.gestoracad.repository.RepositorioEstudiante;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioAdmisionEstudiante;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementación del servicio de gestión del proceso de admisión de estudiantes.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioAdmisionEstudianteImpl implements ServicioAdmisionEstudiante {

    private static final String MODULE = "ADMISION";
    private static final String BASE_ENDPOINT = "/api/v1/student-admissions";

    private final RepositorioAdmisionEstudiante admissionRepository;
    private final RepositorioEstudiante studentRepository;
    private final MapeadorAdmisionEstudiante admissionMapper;
    private final ServicioAuditoria auditService;

    public ServicioAdmisionEstudianteImpl(RepositorioAdmisionEstudiante admissionRepository,
                                       RepositorioEstudiante studentRepository,
                                       MapeadorAdmisionEstudiante admissionMapper,
                                       ServicioAuditoria auditService) {
        this.admissionRepository = admissionRepository;
        this.studentRepository = studentRepository;
        this.admissionMapper = admissionMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoAdmisionEstudiante> getAdmissionsByStudent(Long studentId) {
        return admissionRepository.findByStudentIdAndActiveTrueOrderByPeriodDescAdmissionDateDesc(studentId)
                .stream()
                .map(admissionMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DtoAdmisionEstudiante getAdmissionById(Long id) {
        return admissionRepository.findByIdAndActiveTrue(id)
                .map(admissionMapper::toDto)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Admisión", "id", id));
    }

    @Override
    @Transactional
    public DtoAdmisionEstudiante createAdmission(Long studentId, DtoAdmisionEstudiante dto, String clientIp, String userAgent) {
        Estudiante student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Estudiante", "id", studentId));

        String period = dto.getPeriod().trim();
        if (admissionRepository.existsByStudentIdAndPeriodAndActiveTrue(studentId, period)) {
            auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                    "Intento fallido de registrar admisión duplicada en el periodo: " + period,
                    BASE_ENDPOINT, "POST", clientIp, "FAILURE", userAgent, "tb_estudiante_admisiones", null);
            throw new ExcepcionApi("El estudiante ya tiene registrado un ingreso en el periodo '" + period + "'");
        }

        AdmisionEstudiante entity = new AdmisionEstudiante();
        admissionMapper.updateEntity(entity, dto);
        entity.setPeriod(period);
        entity.setStudent(student);
        entity.setActive(true);

        AdmisionEstudiante saved = admissionRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                "Admisión registrada: " + saved.getModality() + " (" + saved.getPeriod() + ") para "
                        + student.getFirstName() + " " + student.getLastName(),
                BASE_ENDPOINT, "POST", clientIp, "SUCCESS", userAgent, "tb_estudiante_admisiones", saved.getId());

        return admissionMapper.toDto(saved);
    }

    @Override
    @Transactional
    public DtoAdmisionEstudiante updateAdmission(Long id, DtoAdmisionEstudiante dto, String clientIp, String userAgent) {
        AdmisionEstudiante entity = admissionRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Admisión", "id", id));

        String newPeriod = dto.getPeriod().trim();
        Long studentId = entity.getStudent().getId();
        if (!newPeriod.equals(entity.getPeriod())
                && admissionRepository.existsByStudentIdAndPeriodAndActiveTrue(studentId, newPeriod)) {
            auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                    "Intento fallido de actualizar admisión duplicada en el periodo: " + newPeriod,
                    BASE_ENDPOINT + "/" + id, "PUT", clientIp, "FAILURE", userAgent, "tb_estudiante_admisiones", id);
            throw new ExcepcionApi("El estudiante ya tiene registrado un ingreso en el periodo '" + newPeriod + "'");
        }

        admissionMapper.updateEntity(entity, dto);
        entity.setPeriod(newPeriod);

        AdmisionEstudiante saved = admissionRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                "Admisión actualizada: " + saved.getModality() + " (" + saved.getPeriod() + ")",
                BASE_ENDPOINT + "/" + id, "PUT", clientIp, "SUCCESS", userAgent, "tb_estudiante_admisiones", saved.getId());

        return admissionMapper.toDto(saved);
    }

    @Override
    @Transactional
    public void deleteAdmission(Long id, String clientIp, String userAgent) {
        AdmisionEstudiante entity = admissionRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Admisión", "id", id));

        entity.setActive(false);
        entity.setDeletedAt(LocalDateTime.now());
        admissionRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, MODULE,
                "Admisión eliminada: " + entity.getModality() + " (" + entity.getPeriod() + ")",
                BASE_ENDPOINT + "/" + id, "DELETE", clientIp, "SUCCESS", userAgent, "tb_estudiante_admisiones", id);
    }
}
