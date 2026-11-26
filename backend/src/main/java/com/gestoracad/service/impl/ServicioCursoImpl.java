package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoCurso;
import com.gestoracad.entity.Curso;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.mapper.MapeadorCurso;
import com.gestoracad.repository.RepositorioCurso;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioCurso;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Implementación del catálogo de cursos.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioCursoImpl implements ServicioCurso {

    private static final String MODULE = "CURSO";
    private static final String BASE_ENDPOINT = "/api/v1/courses";
    private static final String ENTITY = "tb_cursos";
    private static final Set<String> TIPOS = Set.of("GENERAL", "ESPECIFICO", "ELECTIVO");

    private final RepositorioCurso courseRepository;
    private final MapeadorCurso courseMapper;
    private final ServicioAuditoria auditService;

    public ServicioCursoImpl(RepositorioCurso courseRepository,
                             MapeadorCurso courseMapper,
                             ServicioAuditoria auditService) {
        this.courseRepository = courseRepository;
        this.courseMapper = courseMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoCurso> getAllCourses() {
        return courseRepository.findAllByOrderByCodeAsc()
                .stream()
                .map(courseMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DtoCurso getCourseById(Long id) {
        return courseRepository.findById(id)
                .map(courseMapper::toDto)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Curso", "id", id));
    }

    @Override
    @Transactional
    public DtoCurso createCourse(DtoCurso dto, String clientIp, String userAgent) {
        validateCourse(dto);
        String code = normalizeCode(dto.getCode());
        if (courseRepository.existsByCodeIgnoreCase(code)) {
            registerFailure(AccionAuditoria.CREATE,
                    "Intento fallido de registrar curso con código duplicado: " + code,
                    BASE_ENDPOINT, "POST", clientIp, userAgent, null);
            throw new ExcepcionApi("El curso '" + code + "' ya se encuentra registrado");
        }

        Curso entity = new Curso();
        courseMapper.updateEntity(entity, dto);
        entity.setCode(code);
        entity.setType(dto.getType().toUpperCase());
        entity.setActive(true);

        Curso saved = courseRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                "Curso registrado: " + saved.getCode() + " (" + saved.getName() + ")",
                BASE_ENDPOINT, "POST", clientIp, "SUCCESS", userAgent, ENTITY, saved.getId());

        return courseMapper.toDto(saved);
    }

    @Override
    @Transactional
    public DtoCurso updateCourse(Long id, DtoCurso dto, String clientIp, String userAgent) {
        validateCourse(dto);
        Curso entity = courseRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Curso", "id", id));

        String code = normalizeCode(dto.getCode());
        if (!code.equalsIgnoreCase(entity.getCode()) && courseRepository.existsByCodeIgnoreCase(code)) {
            registerFailure(AccionAuditoria.UPDATE,
                    "Intento fallido de actualizar curso con código duplicado: " + code,
                    BASE_ENDPOINT + "/" + id, "PUT", clientIp, userAgent, id);
            throw new ExcepcionApi("El curso '" + code + "' ya se encuentra registrado");
        }

        courseMapper.updateEntity(entity, dto);
        entity.setCode(code);
        entity.setType(dto.getType().toUpperCase());

        Curso saved = courseRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                "Curso actualizado: " + saved.getCode() + " (" + saved.getName() + ")",
                BASE_ENDPOINT + "/" + id, "PUT", clientIp, "SUCCESS", userAgent, ENTITY, saved.getId());

        return courseMapper.toDto(saved);
    }

    @Override
    @Transactional
    public void deleteCourse(Long id, String clientIp, String userAgent) {
        Curso entity = courseRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Curso", "id", id));

        entity.setActive(false);
        entity.setDeletedAt(java.time.LocalDateTime.now());
        courseRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, MODULE,
                "Curso desactivado: " + entity.getCode(),
                BASE_ENDPOINT + "/" + id, "DELETE", clientIp, "SUCCESS", userAgent, ENTITY, id);
    }

    private void validateCourse(DtoCurso dto) {
        String type = dto.getType() == null ? "" : dto.getType().toUpperCase();
        if (!TIPOS.contains(type)) {
            throw new ExcepcionApi("El tipo de curso debe ser GENERAL, ESPECIFICO o ELECTIVO");
        }
        if (dto.getTheoryHours() + dto.getPracticeHours() <= 0) {
            throw new ExcepcionApi("El curso debe tener al menos una hora teórica o práctica");
        }
    }

    private String normalizeCode(String code) {
        return code == null ? "" : code.toUpperCase().trim();
    }

    private void registerFailure(AccionAuditoria action, String description, String endpoint,
                                 String method, String clientIp, String userAgent, Long entityId) {
        auditService.log(UtilidadesSeguridad.getCurrentUsername(), action, MODULE, description,
                endpoint, method, clientIp, "FAILURE", userAgent, ENTITY, entityId);
    }
}
