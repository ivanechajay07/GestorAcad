package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoEstudiante;
import com.gestoracad.entity.AdmisionEstudiante;
import com.gestoracad.entity.Carrera;
import com.gestoracad.entity.Estudiante;
import com.gestoracad.entity.Facultad;
import com.gestoracad.entity.Usuario;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.mapper.MapeadorEstudiante;
import com.gestoracad.repository.RepositorioAdmisionEstudiante;
import com.gestoracad.repository.RepositorioEstudiante;
import com.gestoracad.repository.RepositorioUsuario;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioCatalogoAcademico;
import com.gestoracad.service.ServicioEstudiante;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Implementación del servicio de gestión de estudiantes.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioEstudianteImpl implements ServicioEstudiante {

    private static final String MODULE = "ESTUDIANTE";
    private static final String BASE_ENDPOINT = "/api/v1/students";

    private final RepositorioEstudiante studentRepository;
    private final RepositorioAdmisionEstudiante admissionRepository;
    private final RepositorioUsuario userRepository;
    private final MapeadorEstudiante studentMapper;
    private final ServicioCatalogoAcademico catalogService;
    private final ServicioAuditoria auditService;

    public ServicioEstudianteImpl(RepositorioEstudiante studentRepository,
                              RepositorioAdmisionEstudiante admissionRepository,
                              RepositorioUsuario userRepository,
                              MapeadorEstudiante studentMapper,
                              ServicioCatalogoAcademico catalogService,
                              ServicioAuditoria auditService) {
        this.studentRepository = studentRepository;
        this.admissionRepository = admissionRepository;
        this.userRepository = userRepository;
        this.studentMapper = studentMapper;
        this.catalogService = catalogService;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoEstudiante> getAllStudents() {
        return studentRepository.findAllByOrderByLastNameAscFirstNameAsc()
                .stream()
                .map(this::toEnrichedDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoEstudiante> getActiveStudents() {
        return studentRepository.findAllByOrderByLastNameAscFirstNameAsc()
                .stream()
                .filter(Estudiante::isActive)
                .map(this::toEnrichedDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DtoEstudiante getStudentById(Long id) {
        Estudiante entity = studentRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Estudiante", "id", id));
        return toEnrichedDto(entity);
    }

    @Override
    @Transactional
    public DtoEstudiante createStudent(DtoEstudiante dto, String clientIp, String userAgent) {
        String code = dto.getCode().toUpperCase().trim();
        if (studentRepository.existsByCode(code)) {
            auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                    "Intento fallido de registrar estudiante con código duplicado: " + code,
                    BASE_ENDPOINT, "POST", clientIp, "FAILURE", userAgent, "tb_estudiantes", null);
            throw new ExcepcionApi("El código de estudiante '" + code + "' ya se encuentra registrado");
        }

        String documentId = normalize(dto.getDocumentId());
        if (documentId != null && studentRepository.existsByDocumentId(documentId)) {
            auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                    "Intento fallido de registrar estudiante con documento duplicado: " + documentId,
                    BASE_ENDPOINT, "POST", clientIp, "FAILURE", userAgent, "tb_estudiantes", null);
            throw new ExcepcionApi("El documento de identidad '" + documentId + "' ya se encuentra registrado");
        }

        Estudiante entity = new Estudiante();
        studentMapper.updateEntity(entity, dto);
        applyCatalog(entity, dto);
        applyAccountLink(entity, dto.getUserId());
        entity.setCode(code);
        entity.setDocumentId(documentId);
        applyDefaults(entity);
        entity.setActive(true);

        Estudiante saved = studentRepository.save(entity);
        syncAdmission(saved, dto);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                "Estudiante registrado exitosamente: " + saved.getFirstName() + " " + saved.getLastName()
                        + " (" + saved.getCode() + ")",
                BASE_ENDPOINT, "POST", clientIp, "SUCCESS", userAgent, "tb_estudiantes", saved.getId());

        return toEnrichedDto(saved);
    }

    @Override
    @Transactional
    public DtoEstudiante updateStudent(Long id, DtoEstudiante dto, String clientIp, String userAgent) {
        Estudiante entity = studentRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Estudiante", "id", id));

        String newCode = dto.getCode().toUpperCase().trim();
        if (!newCode.equals(entity.getCode()) && studentRepository.existsByCode(newCode)) {
            auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                    "Intento fallido de actualizar estudiante con código duplicado: " + newCode,
                    BASE_ENDPOINT + "/" + id, "PUT", clientIp, "FAILURE", userAgent, "tb_estudiantes", id);
            throw new ExcepcionApi("El código de estudiante '" + newCode + "' ya se encuentra registrado");
        }

        String documentId = normalize(dto.getDocumentId());
        if (documentId != null && !documentId.equals(entity.getDocumentId())) {
            studentRepository.findFirstByDocumentId(documentId).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new ExcepcionApi("El documento de identidad '" + documentId + "' ya se encuentra registrado");
                }
            });
        }

        studentMapper.updateEntity(entity, dto);
        applyCatalog(entity, dto);
        applyAccountLink(entity, dto.getUserId());
        entity.setCode(newCode);
        entity.setDocumentId(documentId);
        applyDefaults(entity);

        Estudiante saved = studentRepository.save(entity);
        syncAdmission(saved, dto);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                "Estudiante actualizado: " + saved.getFirstName() + " " + saved.getLastName()
                        + " (" + saved.getCode() + ")",
                BASE_ENDPOINT + "/" + id, "PUT", clientIp, "SUCCESS", userAgent, "tb_estudiantes", saved.getId());

        return toEnrichedDto(saved);
    }

    @Override
    @Transactional
    public void deleteStudent(Long id, String clientIp, String userAgent) {
        Estudiante entity = studentRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Estudiante", "id", id));

        entity.setActive(false);
        entity.setDeletedAt(LocalDateTime.now());
        studentRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, MODULE,
                "Estudiante desactivado: " + entity.getFirstName() + " " + entity.getLastName()
                        + " (" + entity.getCode() + ")",
                BASE_ENDPOINT + "/" + id, "DELETE", clientIp, "SUCCESS", userAgent, "tb_estudiantes", id);
    }

    @Override
    @Transactional
    public void toggleStudentStatus(Long id, boolean active, String clientIp, String userAgent) {
        Estudiante entity = studentRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Estudiante", "id", id));

        entity.setActive(active);
        entity.setDeletedAt(active ? null : LocalDateTime.now());
        studentRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                "Estado de estudiante " + (active ? "habilitado" : "deshabilitado") + ": "
                        + entity.getFirstName() + " " + entity.getLastName(),
                BASE_ENDPOINT + "/" + id + "/status", "PATCH", clientIp, "SUCCESS", userAgent, "tb_estudiantes", id);
    }

    /**
     * Vincula o desvincula la ficha con una cuenta institucional.
     * La cuenta debe estar activa, tener rol de estudiante y no estar vinculada
     * a otra ficha.
     */
    private void applyAccountLink(Estudiante entity, Long userId) {
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
        boolean hasStudentRole = user.getRoles().stream()
                .anyMatch(role -> "ROLE_ESTUDIANTE".equals(role.getName()));
        if (!hasStudentRole) {
            throw new ExcepcionApi("La cuenta seleccionada no tiene el rol ESTUDIANTE");
        }
        studentRepository.findByUserId(userId).ifPresent(existing -> {
            if (!existing.getId().equals(entity.getId())) {
                throw new ExcepcionApi("La cuenta ya está vinculada a otra ficha de estudiante");
            }
        });
        entity.setUserId(userId);
    }

    private void applyDefaults(Estudiante entity) {
        if (entity.getCurrentCycle() == null || entity.getCurrentCycle() < 1) {
            entity.setCurrentCycle(1);
        }
        if (entity.getApprovedCredits() == null || entity.getApprovedCredits() < 0) {
            entity.setApprovedCredits(0);
        }
        if (entity.getWeightedAverage() == null) {
            entity.setWeightedAverage(BigDecimal.ZERO);
        }
    }

    private DtoEstudiante toEnrichedDto(Estudiante entity) {
        DtoEstudiante dto = studentMapper.toDto(entity);
        if (dto != null) {
            dto.setAdmissionCount(admissionRepository.countByStudentIdAndActiveTrue(entity.getId()));
            admissionRepository
                    .findFirstByStudentIdAndActiveTrueOrderByPeriodAscAdmissionDateAsc(entity.getId())
                    .ifPresent(admission -> {
                        dto.setEntryPeriod(admission.getPeriod());
                        dto.setAdmissionModality(admission.getModality());
                        dto.setHighSchool(admission.getHighSchool());
                    });
        }
        return dto;
    }

    /**
     * Resuelve los nombres recibidos por la API contra el catálogo normalizado.
     * La carrera es la fuente canónica de la relación carrera -> facultad.
     */
    private void applyCatalog(Estudiante entity, DtoEstudiante dto) {
        Carrera career = catalogService.resolveCareer(dto.getCareer(), dto.getFaculty());
        Facultad faculty = career != null
                ? career.getFaculty()
                : catalogService.resolveFaculty(dto.getFaculty());
        entity.setCareer(career);
        entity.setFaculty(faculty);
    }

    /**
     * Mantiene sincronizado el hecho histórico del ingreso: la API sigue
     * enviando periodo, modalidad y colegio, pero se persisten en la admisión.
     */
    private void syncAdmission(Estudiante student, DtoEstudiante dto) {
        if (!StringUtils.hasText(dto.getEntryPeriod())) {
            return;
        }
        String period = dto.getEntryPeriod().trim();
        List<AdmisionEstudiante> admissions = admissionRepository
                .findByStudentIdAndActiveTrueOrderByPeriodDescAdmissionDateDesc(student.getId());
        Optional<AdmisionEstudiante> existing = admissions.stream()
                .filter(AdmisionEstudiante::isActive)
                .filter(admission -> period.equalsIgnoreCase(admission.getPeriod()))
                .findFirst();

        AdmisionEstudiante admission;
        if (existing.isPresent()) {
            admission = existing.get();
        } else {
            admission = admissionRepository
                    .findFirstByStudentIdAndActiveTrueOrderByPeriodAscAdmissionDateAsc(student.getId())
                    .orElseGet(() -> {
                        AdmisionEstudiante created = new AdmisionEstudiante();
                        created.setStudent(student);
                        created.setStatus("MATRICULADO");
                        return created;
                    });
            admission.setPeriod(period);
        }
        if (StringUtils.hasText(dto.getAdmissionModality())) {
            admission.setModality(dto.getAdmissionModality().trim());
        } else if (!StringUtils.hasText(admission.getModality())) {
            admission.setModality("ORDINARIO");
        }
        admission.setHighSchool(dto.getHighSchool());
        admissionRepository.save(admission);
    }

    private String normalize(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
