package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoDocente;
import com.gestoracad.entity.Docente;
import com.gestoracad.entity.Usuario;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.mapper.MapeadorDocente;
import com.gestoracad.repository.RepositorioAsignacionDocente;
import com.gestoracad.repository.RepositorioDocente;
import com.gestoracad.repository.RepositorioEspecialidadDocente;
import com.gestoracad.repository.RepositorioUsuario;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioCatalogoAcademico;
import com.gestoracad.service.ServicioDocente;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementación del servicio de gestión de docentes.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioDocenteImpl implements ServicioDocente {

    private static final String MODULE = "DOCENTE";
    private static final String BASE_ENDPOINT = "/api/v1/teachers";

    private final RepositorioDocente teacherRepository;
    private final RepositorioEspecialidadDocente specialtyRepository;
    private final RepositorioAsignacionDocente assignmentRepository;
    private final RepositorioUsuario userRepository;
    private final MapeadorDocente teacherMapper;
    private final ServicioCatalogoAcademico catalogService;
    private final ServicioAuditoria auditService;

    public ServicioDocenteImpl(RepositorioDocente teacherRepository,
                              RepositorioEspecialidadDocente specialtyRepository,
                              RepositorioAsignacionDocente assignmentRepository,
                              RepositorioUsuario userRepository,
                              MapeadorDocente teacherMapper,
                              ServicioCatalogoAcademico catalogService,
                              ServicioAuditoria auditService) {
        this.teacherRepository = teacherRepository;
        this.specialtyRepository = specialtyRepository;
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
        this.teacherMapper = teacherMapper;
        this.catalogService = catalogService;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoDocente> getAllTeachers() {
        return teacherRepository.findAllByOrderByLastNameAscFirstNameAsc()
                .stream()
                .map(this::toEnrichedDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoDocente> getActiveTeachers() {
        return teacherRepository.findAllByOrderByLastNameAscFirstNameAsc()
                .stream()
                .filter(Docente::isActive)
                .map(this::toEnrichedDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DtoDocente getTeacherById(Long id) {
        Docente entity = teacherRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Docente", "id", id));
        return toEnrichedDto(entity);
    }

    @Override
    @Transactional
    public DtoDocente createTeacher(DtoDocente dto, String clientIp, String userAgent) {
        String code = dto.getCode().toUpperCase().trim();
        if (teacherRepository.existsByCode(code)) {
            auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                    "Intento fallido de registrar docente con código duplicado: " + code,
                    BASE_ENDPOINT, "POST", clientIp, "FAILURE", userAgent, "tb_docentes", null);
            throw new ExcepcionApi("El código de docente '" + code + "' ya se encuentra registrado");
        }

        String documentId = normalize(dto.getDocumentId());
        if (documentId != null && teacherRepository.existsByDocumentId(documentId)) {
            auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                    "Intento fallido de registrar docente con documento duplicado: " + documentId,
                    BASE_ENDPOINT, "POST", clientIp, "FAILURE", userAgent, "tb_docentes", null);
            throw new ExcepcionApi("El documento de identidad '" + documentId + "' ya se encuentra registrado");
        }

        Docente entity = new Docente();
        teacherMapper.updateEntity(entity, dto);
        applyAccountLink(entity, dto.getUserId());
        entity.setFaculty(catalogService.resolveFaculty(dto.getFaculty()));
        entity.setCode(code);
        entity.setDocumentId(documentId);
        entity.setActive(true);

        Docente saved = teacherRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                "Docente registrado exitosamente: " + saved.getFirstName() + " " + saved.getLastName()
                        + " (" + saved.getCode() + ")",
                BASE_ENDPOINT, "POST", clientIp, "SUCCESS", userAgent, "tb_docentes", saved.getId());

        return toEnrichedDto(saved);
    }

    @Override
    @Transactional
    public DtoDocente updateTeacher(Long id, DtoDocente dto, String clientIp, String userAgent) {
        Docente entity = teacherRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Docente", "id", id));

        String newCode = dto.getCode().toUpperCase().trim();
        if (!newCode.equals(entity.getCode()) && teacherRepository.existsByCode(newCode)) {
            auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                    "Intento fallido de actualizar docente con código duplicado: " + newCode,
                    BASE_ENDPOINT + "/" + id, "PUT", clientIp, "FAILURE", userAgent, "tb_docentes", id);
            throw new ExcepcionApi("El código de docente '" + newCode + "' ya se encuentra registrado");
        }

        String documentId = normalize(dto.getDocumentId());
        if (documentId != null && !documentId.equals(entity.getDocumentId())) {
            teacherRepository.findFirstByDocumentId(documentId).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new ExcepcionApi("El documento de identidad '" + documentId + "' ya se encuentra registrado");
                }
            });
        }

        teacherMapper.updateEntity(entity, dto);
        applyAccountLink(entity, dto.getUserId());
        entity.setFaculty(catalogService.resolveFaculty(dto.getFaculty()));
        entity.setCode(newCode);
        entity.setDocumentId(documentId);

        Docente saved = teacherRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                "Docente actualizado: " + saved.getFirstName() + " " + saved.getLastName()
                        + " (" + saved.getCode() + ")",
                BASE_ENDPOINT + "/" + id, "PUT", clientIp, "SUCCESS", userAgent, "tb_docentes", saved.getId());

        return toEnrichedDto(saved);
    }

    private void applyAccountLink(Docente entity, Long userId) {
        if (userId == null) {
            return;
        }
        if (userId <= 0) {
            entity.setUserId(null);
            return;
        }
        Usuario user = userRepository.findById(userId)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Usuario", "id", userId));
        if (!user.isActive()) {
            throw new ExcepcionApi("La cuenta seleccionada está desactivada");
        }
        boolean hasTeacherRole = user.getRoles().stream()
                .anyMatch(role -> "ROLE_DOCENTE".equals(role.getName()));
        if (!hasTeacherRole) {
            throw new ExcepcionApi("La cuenta seleccionada no tiene el rol DOCENTE");
        }
        teacherRepository.findByUserId(userId).ifPresent(existing -> {
            if (!existing.getId().equals(entity.getId())) {
                throw new ExcepcionApi("La cuenta ya está vinculada a otra ficha de docente");
            }
        });
        entity.setUserId(userId);
    }

    @Override
    @Transactional
    public void deleteTeacher(Long id, String clientIp, String userAgent) {
        Docente entity = teacherRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Docente", "id", id));

        entity.setActive(false);
        entity.setDeletedAt(LocalDateTime.now());
        teacherRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, MODULE,
                "Docente desactivado: " + entity.getFirstName() + " " + entity.getLastName()
                        + " (" + entity.getCode() + ")",
                BASE_ENDPOINT + "/" + id, "DELETE", clientIp, "SUCCESS", userAgent, "tb_docentes", id);
    }

    @Override
    @Transactional
    public void toggleTeacherStatus(Long id, boolean active, String clientIp, String userAgent) {
        Docente entity = teacherRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Docente", "id", id));

        entity.setActive(active);
        entity.setDeletedAt(active ? null : LocalDateTime.now());
        teacherRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                "Estado de docente " + (active ? "habilitado" : "deshabilitado") + ": "
                        + entity.getFirstName() + " " + entity.getLastName(),
                BASE_ENDPOINT + "/" + id + "/status", "PATCH", clientIp, "SUCCESS", userAgent, "tb_docentes", id);
    }

    private DtoDocente toEnrichedDto(Docente entity) {
        DtoDocente dto = teacherMapper.toDto(entity);
        if (dto != null) {
            dto.setSpecialtyCount(specialtyRepository.countByTeacherIdAndActiveTrue(entity.getId()));
            dto.setAssignmentCount(assignmentRepository.countByTeacherIdAndActiveTrue(entity.getId()));
            dto.setWeeklyLoad(assignmentRepository.sumWeeklyLoadByTeacherId(entity.getId()));
        }
        return dto;
    }

    private String normalize(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
