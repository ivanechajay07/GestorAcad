package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoSeccion;
import com.gestoracad.entity.Curso;
import com.gestoracad.entity.Docente;
import com.gestoracad.entity.PeriodoAcademico;
import com.gestoracad.entity.Seccion;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.mapper.MapeadorSeccion;
import com.gestoracad.repository.RepositorioCurso;
import com.gestoracad.repository.RepositorioDocente;
import com.gestoracad.repository.RepositorioMatricula;
import com.gestoracad.repository.RepositorioPeriodoAcademico;
import com.gestoracad.repository.RepositorioSeccion;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioSeccion;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Implementación del mantenimiento de secciones.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioSeccionImpl implements ServicioSeccion {

    private static final String MODULE = "SECCION";
    private static final String BASE_ENDPOINT = "/api/v1/sections";
    private static final String ENTITY = "tb_secciones";

    private final RepositorioSeccion sectionRepository;
    private final RepositorioPeriodoAcademico periodRepository;
    private final RepositorioCurso courseRepository;
    private final RepositorioDocente teacherRepository;
    private final RepositorioMatricula enrollmentRepository;
    private final MapeadorSeccion sectionMapper;
    private final ServicioAuditoria auditService;

    public ServicioSeccionImpl(RepositorioSeccion sectionRepository,
                               RepositorioPeriodoAcademico periodRepository,
                               RepositorioCurso courseRepository,
                               RepositorioDocente teacherRepository,
                               RepositorioMatricula enrollmentRepository,
                               MapeadorSeccion sectionMapper,
                               ServicioAuditoria auditService) {
        this.sectionRepository = sectionRepository;
        this.periodRepository = periodRepository;
        this.courseRepository = courseRepository;
        this.teacherRepository = teacherRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.sectionMapper = sectionMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoSeccion> getAllSections() {
        return sectionRepository.findAllDetailed()
                .stream()
                .map(this::enrich)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DtoSeccion getSectionById(Long id) {
        return sectionRepository.findById(id)
                .map(this::enrich)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Sección", "id", id));
    }

    @Override
    @Transactional
    public DtoSeccion createSection(DtoSeccion dto, String clientIp, String userAgent) {
        PeriodoAcademico period = resolvePeriod(dto.getPeriodId());
        Curso course = resolveCourse(dto.getCourseId());
        Docente teacher = resolveTeacher(dto.getTeacherId());
        String code = normalizeCode(dto.getCode());
        ensureUnique(period.getId(), course.getId(), code, null, clientIp, userAgent, null);

        Seccion entity = new Seccion();
        apply(entity, period, course, teacher, dto, code);
        entity.setActive(true);
        Seccion saved = sectionRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                "Sección registrada: " + course.getCode() + "-" + code + " (" + period.getCode() + ")",
                BASE_ENDPOINT, "POST", clientIp, "SUCCESS", userAgent, ENTITY, saved.getId());

        return enrich(saved);
    }

    @Override
    @Transactional
    public DtoSeccion updateSection(Long id, DtoSeccion dto, String clientIp, String userAgent) {
        Seccion entity = sectionRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Sección", "id", id));
        PeriodoAcademico period = resolvePeriod(dto.getPeriodId());
        Curso course = resolveCourse(dto.getCourseId());
        Docente teacher = resolveTeacher(dto.getTeacherId());
        String code = normalizeCode(dto.getCode());
        ensureUnique(period.getId(), course.getId(), code, id, clientIp, userAgent, id);

        long enrolled = enrollmentRepository.countActiveBySectionId(id);
        if (dto.getCapacity() < enrolled) {
            throw new ExcepcionApi("La capacidad no puede ser menor a los " + enrolled + " estudiantes matriculados");
        }

        apply(entity, period, course, teacher, dto, code);
        Seccion saved = sectionRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                "Sección actualizada: " + course.getCode() + "-" + code + " (" + period.getCode() + ")",
                BASE_ENDPOINT + "/" + id, "PUT", clientIp, "SUCCESS", userAgent, ENTITY, saved.getId());

        return enrich(saved);
    }

    @Override
    @Transactional
    public void deleteSection(Long id, String clientIp, String userAgent) {
        Seccion entity = sectionRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Sección", "id", id));
        long enrolled = enrollmentRepository.countActiveBySectionId(id);
        if (enrolled > 0) {
            registerFailure(AccionAuditoria.DELETE,
                    "Intento fallido de desactivar sección con " + enrolled + " matrículas activas",
                    BASE_ENDPOINT + "/" + id, "DELETE", clientIp, userAgent, id);
            throw new ExcepcionApi("No se puede desactivar una sección con estudiantes matriculados");
        }

        entity.setActive(false);
        entity.setDeletedAt(java.time.LocalDateTime.now());
        sectionRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, MODULE,
                "Sección desactivada: " + entity.getCourse().getCode() + "-" + entity.getCode(),
                BASE_ENDPOINT + "/" + id, "DELETE", clientIp, "SUCCESS", userAgent, ENTITY, id);
    }

    private void apply(Seccion entity, PeriodoAcademico period, Curso course, Docente teacher,
                       DtoSeccion dto, String code) {
        entity.setPeriod(period);
        entity.setCourse(course);
        entity.setTeacher(teacher);
        entity.setCode(code);
        entity.setCapacity(dto.getCapacity());
        entity.setShift(dto.getShift());
        entity.setClassroom(dto.getClassroom());
        entity.setSchedule(dto.getSchedule());
    }

    private PeriodoAcademico resolvePeriod(Long id) {
        PeriodoAcademico period = periodRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Periodo académico", "id", id));
        if (!period.isActive()) {
            throw new ExcepcionApi("El periodo seleccionado está desactivado");
        }
        return period;
    }

    private Curso resolveCourse(Long id) {
        Curso course = courseRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Curso", "id", id));
        if (!course.isActive()) {
            throw new ExcepcionApi("El curso seleccionado está desactivado");
        }
        return course;
    }

    private Docente resolveTeacher(Long id) {
        if (id == null) {
            return null;
        }
        Docente teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Docente", "id", id));
        if (!teacher.isActive()) {
            throw new ExcepcionApi("El docente seleccionado está desactivado");
        }
        return teacher;
    }

    private void ensureUnique(Long periodId, Long courseId, String code, Long currentId,
                              String clientIp, String userAgent, Long entityId) {
        Optional<Seccion> existing = sectionRepository
                .findByPeriodIdAndCourseIdAndCodeIgnoreCase(periodId, courseId, code);
        if (existing.isPresent() && (currentId == null || !existing.get().getId().equals(currentId))) {
            registerFailure(AccionAuditoria.CREATE,
                    "Intento fallido de duplicar la sección " + code + " para el curso " + courseId,
                    BASE_ENDPOINT, "POST", clientIp, userAgent, entityId);
            throw new ExcepcionApi("Ya existe la sección '" + code + "' para ese curso y periodo");
        }
    }

    private DtoSeccion enrich(Seccion section) {
        DtoSeccion dto = sectionMapper.toDto(section);
        if (dto != null) {
            long enrolled = enrollmentRepository.countActiveBySectionId(section.getId());
            dto.setEnrolledCount(enrolled);
            dto.setAvailable(Math.max(0, section.getCapacity() - enrolled));
        }
        return dto;
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
