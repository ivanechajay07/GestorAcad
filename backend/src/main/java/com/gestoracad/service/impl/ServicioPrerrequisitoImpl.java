package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoPrerrequisito;
import com.gestoracad.entity.Curso;
import com.gestoracad.entity.PrerrequisitoCurso;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.mapper.MapeadorPrerrequisito;
import com.gestoracad.repository.RepositorioCurso;
import com.gestoracad.repository.RepositorioPrerrequisitoCurso;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioPrerrequisito;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementación de prerrequisitos entre cursos.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioPrerrequisitoImpl implements ServicioPrerrequisito {

    private static final String MODULE = "CURSO";
    private static final String ENTITY = "tb_curso_prerrequisitos";

    private final RepositorioPrerrequisitoCurso prerequisiteRepository;
    private final RepositorioCurso courseRepository;
    private final MapeadorPrerrequisito prerequisiteMapper;
    private final ServicioAuditoria auditService;

    public ServicioPrerrequisitoImpl(RepositorioPrerrequisitoCurso prerequisiteRepository,
                                     RepositorioCurso courseRepository,
                                     MapeadorPrerrequisito prerequisiteMapper,
                                     ServicioAuditoria auditService) {
        this.prerequisiteRepository = prerequisiteRepository;
        this.courseRepository = courseRepository;
        this.prerequisiteMapper = prerequisiteMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoPrerrequisito> getPrerequisites(Long courseId) {
        ensureCourse(courseId);
        return prerequisiteRepository.findByCourseIdAndActiveTrue(courseId)
                .stream()
                .sorted(Comparator.comparing(p -> p.getPrerequisite().getCode()))
                .map(prerequisiteMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DtoPrerrequisito addPrerequisite(Long courseId, Long prerequisiteId, String clientIp, String userAgent) {
        Curso course = ensureCourse(courseId);
        Curso prerequisite = courseRepository.findById(prerequisiteId)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Curso prerrequisito", "id", prerequisiteId));
        if (course.getId().equals(prerequisite.getId())) {
            throw new ExcepcionApi("Un curso no puede ser prerrequisito de sí mismo");
        }
        if (prerequisiteRepository.existsByCourseIdAndPrerequisiteIdAndActiveTrue(prerequisiteId, courseId)) {
            throw new ExcepcionApi("Se produciría una dependencia circular entre " + course.getCode()
                    + " y " + prerequisite.getCode());
        }

        PrerrequisitoCurso existing = prerequisiteRepository
                .findByCourseIdAndPrerequisiteId(courseId, prerequisiteId)
                .orElse(null);
        if (existing != null && existing.isActive()) {
            throw new ExcepcionApi("El curso '" + prerequisite.getCode() + "' ya es prerrequisito");
        }
        PrerrequisitoCurso entity = existing != null ? existing : new PrerrequisitoCurso();
        entity.setCourse(course);
        entity.setPrerequisite(prerequisite);
        entity.setActive(true);
        entity.setDeletedAt(null);
        PrerrequisitoCurso saved = prerequisiteRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                "Prerrequisito agregado: " + course.getCode() + " requiere " + prerequisite.getCode(),
                "/api/v1/courses/" + courseId + "/prerequisites", "POST", clientIp, "SUCCESS", userAgent,
                ENTITY, saved.getId());

        return prerequisiteMapper.toDto(saved);
    }

    @Override
    @Transactional
    public void removePrerequisite(Long courseId, Long prerequisiteId, String clientIp, String userAgent) {
        ensureCourse(courseId);
        PrerrequisitoCurso entity = prerequisiteRepository.findByIdAndCourseId(prerequisiteId, courseId)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Prerrequisito", "id", prerequisiteId));
        entity.setActive(false);
        entity.setDeletedAt(java.time.LocalDateTime.now());
        prerequisiteRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, MODULE,
                "Prerrequisito retirado del curso " + courseId,
                "/api/v1/courses/" + courseId + "/prerequisites/" + prerequisiteId, "DELETE", clientIp,
                "SUCCESS", userAgent, ENTITY, prerequisiteId);
    }

    private Curso ensureCourse(Long courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Curso", "id", courseId));
    }
}
