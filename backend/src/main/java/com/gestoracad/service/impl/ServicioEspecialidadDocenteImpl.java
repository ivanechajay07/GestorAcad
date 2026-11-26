package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoEspecialidadDocente;
import com.gestoracad.entity.Docente;
import com.gestoracad.entity.EspecialidadDocente;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.mapper.MapeadorEspecialidadDocente;
import com.gestoracad.repository.RepositorioDocente;
import com.gestoracad.repository.RepositorioEspecialidadDocente;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioEspecialidadDocente;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementación del servicio de gestión de especialidades docentes.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioEspecialidadDocenteImpl implements ServicioEspecialidadDocente {

    private static final String MODULE = "ESPECIALIDAD";
    private static final String BASE_ENDPOINT = "/api/v1/teacher-specialties";

    private final RepositorioEspecialidadDocente specialtyRepository;
    private final RepositorioDocente teacherRepository;
    private final MapeadorEspecialidadDocente specialtyMapper;
    private final ServicioAuditoria auditService;

    public ServicioEspecialidadDocenteImpl(RepositorioEspecialidadDocente specialtyRepository,
                                       RepositorioDocente teacherRepository,
                                       MapeadorEspecialidadDocente specialtyMapper,
                                       ServicioAuditoria auditService) {
        this.specialtyRepository = specialtyRepository;
        this.teacherRepository = teacherRepository;
        this.specialtyMapper = specialtyMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoEspecialidadDocente> getSpecialtiesByTeacher(Long teacherId) {
        return specialtyRepository.findByTeacherIdOrderByYearDescNameAsc(teacherId)
                .stream()
                .map(specialtyMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DtoEspecialidadDocente getSpecialtyById(Long id) {
        return specialtyRepository.findById(id)
                .map(specialtyMapper::toDto)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Especialidad", "id", id));
    }

    @Override
    @Transactional
    public DtoEspecialidadDocente createSpecialty(Long teacherId, DtoEspecialidadDocente dto, String clientIp, String userAgent) {
        Docente teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Docente", "id", teacherId));

        if (specialtyRepository.existsByTeacherIdAndName(teacherId, dto.getName().trim())) {
            auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                    "Intento fallido de registrar especialidad duplicada: " + dto.getName(),
                    BASE_ENDPOINT, "POST", clientIp, "FAILURE", userAgent, "tb_docente_especialidades", null);
            throw new ExcepcionApi("El docente ya tiene registrada la especialidad '" + dto.getName() + "'");
        }

        EspecialidadDocente entity = new EspecialidadDocente();
        specialtyMapper.updateEntity(entity, dto);
        entity.setName(dto.getName().trim());
        entity.setTeacher(teacher);
        entity.setActive(true);

        EspecialidadDocente saved = specialtyRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                "Especialidad registrada: " + saved.getName() + " para " + teacher.getFirstName()
                        + " " + teacher.getLastName(),
                BASE_ENDPOINT, "POST", clientIp, "SUCCESS", userAgent, "tb_docente_especialidades", saved.getId());

        return specialtyMapper.toDto(saved);
    }

    @Override
    @Transactional
    public DtoEspecialidadDocente updateSpecialty(Long id, DtoEspecialidadDocente dto, String clientIp, String userAgent) {
        EspecialidadDocente entity = specialtyRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Especialidad", "id", id));

        String newName = dto.getName().trim();
        Long teacherId = entity.getTeacher().getId();
        if (!newName.equals(entity.getName()) && specialtyRepository.existsByTeacherIdAndName(teacherId, newName)) {
            auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                    "Intento fallido de actualizar especialidad duplicada: " + newName,
                    BASE_ENDPOINT + "/" + id, "PUT", clientIp, "FAILURE", userAgent, "tb_docente_especialidades", id);
            throw new ExcepcionApi("El docente ya tiene registrada la especialidad '" + newName + "'");
        }

        specialtyMapper.updateEntity(entity, dto);
        entity.setName(newName);

        EspecialidadDocente saved = specialtyRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                "Especialidad actualizada: " + saved.getName(),
                BASE_ENDPOINT + "/" + id, "PUT", clientIp, "SUCCESS", userAgent, "tb_docente_especialidades", saved.getId());

        return specialtyMapper.toDto(saved);
    }

    @Override
    @Transactional
    public void deleteSpecialty(Long id, String clientIp, String userAgent) {
        EspecialidadDocente entity = specialtyRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Especialidad", "id", id));

        entity.setActive(false);
        entity.setDeletedAt(LocalDateTime.now());
        specialtyRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, MODULE,
                "Especialidad eliminada: " + entity.getName(),
                BASE_ENDPOINT + "/" + id, "DELETE", clientIp, "SUCCESS", userAgent, "tb_docente_especialidades", id);
    }
}
