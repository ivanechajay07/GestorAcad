package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoFacultad;
import com.gestoracad.entity.Facultad;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.mapper.MapeadorFacultad;
import com.gestoracad.repository.RepositorioCarrera;
import com.gestoracad.repository.RepositorioDocente;
import com.gestoracad.repository.RepositorioEstudiante;
import com.gestoracad.repository.RepositorioFacultad;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioFacultad;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementación del servicio de gestión del catálogo de facultades.
 * Una facultad es la raíz de la jerarquía académica, por lo que no se permite
 * desactivarla mientras tenga carreras, estudiantes o docentes activos.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioFacultadImpl implements ServicioFacultad {

    private static final String MODULE = "FACULTAD";
    private static final String BASE_ENDPOINT = "/api/v1/faculties";
    private static final String ENTITY = "tb_facultades";

    private final RepositorioFacultad facultyRepository;
    private final RepositorioCarrera careerRepository;
    private final RepositorioEstudiante studentRepository;
    private final RepositorioDocente teacherRepository;
    private final MapeadorFacultad facultyMapper;
    private final ServicioAuditoria auditService;

    public ServicioFacultadImpl(RepositorioFacultad facultyRepository,
                                RepositorioCarrera careerRepository,
                                RepositorioEstudiante studentRepository,
                                RepositorioDocente teacherRepository,
                                MapeadorFacultad facultyMapper,
                                ServicioAuditoria auditService) {
        this.facultyRepository = facultyRepository;
        this.careerRepository = careerRepository;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.facultyMapper = facultyMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoFacultad> getAllFaculties() {
        return facultyRepository.findAllByOrderByNameAsc()
                .stream()
                .map(this::toEnrichedDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DtoFacultad getFacultyById(Long id) {
        return facultyRepository.findById(id)
                .map(this::toEnrichedDto)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Facultad", "id", id));
    }

    @Override
    @Transactional
    public DtoFacultad createFaculty(DtoFacultad dto, String clientIp, String userAgent) {
        String name = normalizeName(dto.getName());
        if (facultyRepository.existsByNameIgnoreCase(name)) {
            registerFailure(AccionAuditoria.CREATE, "Intento fallido de registrar facultad con nombre duplicado: " + name,
                    BASE_ENDPOINT, "POST", clientIp, userAgent, null);
            throw new ExcepcionApi("La facultad '" + name + "' ya se encuentra registrada");
        }

        Facultad entity = new Facultad();
        facultyMapper.updateEntity(entity, dto);
        entity.setName(name);
        entity.setActive(true);

        Facultad saved = facultyRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                "Facultad registrada exitosamente: " + saved.getName(),
                BASE_ENDPOINT, "POST", clientIp, "SUCCESS", userAgent, ENTITY, saved.getId());

        return toEnrichedDto(saved);
    }

    @Override
    @Transactional
    public DtoFacultad updateFaculty(Long id, DtoFacultad dto, String clientIp, String userAgent) {
        Facultad entity = facultyRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Facultad", "id", id));

        String name = normalizeName(dto.getName());
        if (!name.equalsIgnoreCase(entity.getName()) && facultyRepository.existsByNameIgnoreCase(name)) {
            registerFailure(AccionAuditoria.UPDATE, "Intento fallido de actualizar facultad con nombre duplicado: " + name,
                    BASE_ENDPOINT + "/" + id, "PUT", clientIp, userAgent, id);
            throw new ExcepcionApi("La facultad '" + name + "' ya se encuentra registrada");
        }

        facultyMapper.updateEntity(entity, dto);
        entity.setName(name);

        Facultad saved = facultyRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                "Facultad actualizada: " + saved.getName(),
                BASE_ENDPOINT + "/" + id, "PUT", clientIp, "SUCCESS", userAgent, ENTITY, saved.getId());

        return toEnrichedDto(saved);
    }

    @Override
    @Transactional
    public void deleteFaculty(Long id, String clientIp, String userAgent) {
        Facultad entity = facultyRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Facultad", "id", id));

        long activeCareers = careerRepository.countByFacultyIdAndActiveTrue(id);
        if (activeCareers > 0) {
            registerFailure(AccionAuditoria.DELETE, "Intento fallido de desactivar facultad con carreras activas: " + entity.getName(),
                    BASE_ENDPOINT + "/" + id, "DELETE", clientIp, userAgent, id);
            throw new ExcepcionApi("No se puede desactivar la facultad porque tiene "
                    + activeCareers + " carrera(s) activa(s) asociada(s)");
        }

        long activeStudents = studentRepository.countByFacultyIdAndActiveTrue(id);
        long activeTeachers = teacherRepository.countByFacultyIdAndActiveTrue(id);
        if (activeStudents > 0 || activeTeachers > 0) {
            registerFailure(AccionAuditoria.DELETE, "Intento fallido de desactivar facultad con personas activas: " + entity.getName(),
                    BASE_ENDPOINT + "/" + id, "DELETE", clientIp, userAgent, id);
            throw new ExcepcionApi("No se puede desactivar la facultad porque tiene "
                    + (activeStudents + activeTeachers) + " estudiante(s) o docente(s) activo(s) asociado(s)");
        }

        entity.setActive(false);
        entity.setDeletedAt(java.time.LocalDateTime.now());
        facultyRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, MODULE,
                "Facultad desactivada: " + entity.getName(),
                BASE_ENDPOINT + "/" + id, "DELETE", clientIp, "SUCCESS", userAgent, ENTITY, id);
    }

    private DtoFacultad toEnrichedDto(Facultad entity) {
        DtoFacultad dto = facultyMapper.toDto(entity);
        if (dto != null) {
            dto.setCareerCount(careerRepository.countByFacultyIdAndActiveTrue(entity.getId()));
            dto.setStudentCount(studentRepository.countByFacultyIdAndActiveTrue(entity.getId()));
            dto.setTeacherCount(teacherRepository.countByFacultyIdAndActiveTrue(entity.getId()));
        }
        return dto;
    }

    private String normalizeName(String name) {
        if (!StringUtils.hasText(name)) {
            throw new ExcepcionApi("El nombre de la facultad es obligatorio");
        }
        return name.trim().replaceAll("\\s+", " ");
    }

    private void registerFailure(AccionAuditoria action, String description, String endpoint, String method,
                                 String clientIp, String userAgent, Long entityId) {
        auditService.log(UtilidadesSeguridad.getCurrentUsername(), action, MODULE,
                description, endpoint, method, clientIp, "FAILURE", userAgent, ENTITY, entityId);
    }
}
