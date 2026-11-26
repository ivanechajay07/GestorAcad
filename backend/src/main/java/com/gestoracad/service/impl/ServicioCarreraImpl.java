package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoCarrera;
import com.gestoracad.entity.Carrera;
import com.gestoracad.entity.Facultad;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.mapper.MapeadorCarrera;
import com.gestoracad.repository.RepositorioCarrera;
import com.gestoracad.repository.RepositorioEstudiante;
import com.gestoracad.repository.RepositorioFacultad;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioCarrera;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementación del servicio de gestión del catálogo de carreras.
 * Cada carrera pertenece a una facultad y agrupa a los estudiantes del padrón,
 * por lo que no se permite desactivarla mientras tenga estudiantes activos.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioCarreraImpl implements ServicioCarrera {

    private static final String MODULE = "CARRERA";
    private static final String BASE_ENDPOINT = "/api/v1/careers";
    private static final String ENTITY = "tb_carreras";

    private final RepositorioCarrera careerRepository;
    private final RepositorioFacultad facultyRepository;
    private final RepositorioEstudiante studentRepository;
    private final MapeadorCarrera careerMapper;
    private final ServicioAuditoria auditService;

    public ServicioCarreraImpl(RepositorioCarrera careerRepository,
                               RepositorioFacultad facultyRepository,
                               RepositorioEstudiante studentRepository,
                               MapeadorCarrera careerMapper,
                               ServicioAuditoria auditService) {
        this.careerRepository = careerRepository;
        this.facultyRepository = facultyRepository;
        this.studentRepository = studentRepository;
        this.careerMapper = careerMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoCarrera> getAllCareers() {
        return careerRepository.findAllByOrderByNameAsc()
                .stream()
                .map(this::toEnrichedDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoCarrera> getCareersByFaculty(Long facultyId) {
        return careerRepository.findByFacultyIdOrderByNameAsc(facultyId)
                .stream()
                .map(this::toEnrichedDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DtoCarrera getCareerById(Long id) {
        return careerRepository.findById(id)
                .map(this::toEnrichedDto)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Carrera", "id", id));
    }

    @Override
    @Transactional
    public DtoCarrera createCareer(DtoCarrera dto, String clientIp, String userAgent) {
        String name = normalizeName(dto.getName());
        if (careerRepository.existsByNameIgnoreCase(name)) {
            registerFailure(AccionAuditoria.CREATE,
                    "Intento fallido de registrar carrera con nombre duplicado: " + name,
                    BASE_ENDPOINT, "POST", clientIp, userAgent, null);
            throw new ExcepcionApi("La carrera '" + name + "' ya se encuentra registrada");
        }

        Facultad faculty = resolveFaculty(dto.getFacultyId());
        Carrera entity = new Carrera();
        careerMapper.updateEntity(entity, dto);
        entity.setName(name);
        entity.setFaculty(faculty);
        entity.setActive(true);

        Carrera saved = careerRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                "Carrera registrada exitosamente: " + saved.getName() + " (" + faculty.getName() + ")",
                BASE_ENDPOINT, "POST", clientIp, "SUCCESS", userAgent, ENTITY, saved.getId());

        return toEnrichedDto(saved);
    }

    @Override
    @Transactional
    public DtoCarrera updateCareer(Long id, DtoCarrera dto, String clientIp, String userAgent) {
        Carrera entity = careerRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Carrera", "id", id));

        String name = normalizeName(dto.getName());
        if (!name.equalsIgnoreCase(entity.getName()) && careerRepository.existsByNameIgnoreCase(name)) {
            registerFailure(AccionAuditoria.UPDATE,
                    "Intento fallido de actualizar carrera con nombre duplicado: " + name,
                    BASE_ENDPOINT + "/" + id, "PUT", clientIp, userAgent, id);
            throw new ExcepcionApi("La carrera '" + name + "' ya se encuentra registrada");
        }

        Facultad faculty = resolveFaculty(dto.getFacultyId());
        boolean facultyChanged = entity.getFaculty() == null
                || !entity.getFaculty().getId().equals(faculty.getId());

        careerMapper.updateEntity(entity, dto);
        entity.setName(name);
        entity.setFaculty(faculty);

        Carrera saved = careerRepository.save(entity);

        int synced = 0;
        if (facultyChanged) {
            // La facultad del estudiante se deriva de su carrera: se propaga el cambio.
            synced = studentRepository.syncFacultyByCareerId(saved.getId(), faculty);
        }

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                "Carrera actualizada: " + saved.getName() + " (" + faculty.getName() + ")"
                        + (synced > 0 ? "; " + synced + " estudiante(s) reasignado(s) de facultad" : ""),
                BASE_ENDPOINT + "/" + id, "PUT", clientIp, "SUCCESS", userAgent, ENTITY, saved.getId());

        return toEnrichedDto(saved);
    }

    @Override
    @Transactional
    public void deleteCareer(Long id, String clientIp, String userAgent) {
        Carrera entity = careerRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Carrera", "id", id));

        long activeStudents = studentRepository.countByCareerIdAndActiveTrue(id);
        if (activeStudents > 0) {
            registerFailure(AccionAuditoria.DELETE,
                    "Intento fallido de desactivar carrera con estudiantes activos: " + entity.getName(),
                    BASE_ENDPOINT + "/" + id, "DELETE", clientIp, userAgent, id);
            throw new ExcepcionApi("No se puede desactivar la carrera porque tiene "
                    + activeStudents + " estudiante(s) activo(s) asociado(s)");
        }

        entity.setActive(false);
        entity.setDeletedAt(java.time.LocalDateTime.now());
        careerRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, MODULE,
                "Carrera desactivada: " + entity.getName(),
                BASE_ENDPOINT + "/" + id, "DELETE", clientIp, "SUCCESS", userAgent, ENTITY, id);
    }

    private DtoCarrera toEnrichedDto(Carrera entity) {
        DtoCarrera dto = careerMapper.toDto(entity);
        if (dto != null) {
            dto.setStudentCount(studentRepository.countByCareerIdAndActiveTrue(entity.getId()));
        }
        return dto;
    }

    private Facultad resolveFaculty(Long facultyId) {
        if (facultyId == null) {
            throw new ExcepcionApi("La facultad de la carrera es obligatoria");
        }
        return facultyRepository.findById(facultyId)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Facultad", "id", facultyId));
    }

    private String normalizeName(String name) {
        if (!StringUtils.hasText(name)) {
            throw new ExcepcionApi("El nombre de la carrera es obligatorio");
        }
        return name.trim().replaceAll("\\s+", " ");
    }

    private void registerFailure(AccionAuditoria action, String description, String endpoint, String method,
                                 String clientIp, String userAgent, Long entityId) {
        auditService.log(UtilidadesSeguridad.getCurrentUsername(), action, MODULE,
                description, endpoint, method, clientIp, "FAILURE", userAgent, ENTITY, entityId);
    }
}
