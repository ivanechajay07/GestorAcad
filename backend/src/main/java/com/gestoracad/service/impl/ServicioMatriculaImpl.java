package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoMatricula;
import com.gestoracad.entity.Estudiante;
import com.gestoracad.entity.Matricula;
import com.gestoracad.entity.ParametroSistema;
import com.gestoracad.entity.PeriodoAcademico;
import com.gestoracad.entity.PrerrequisitoCurso;
import com.gestoracad.entity.Seccion;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.mapper.MapeadorMatricula;
import com.gestoracad.repository.RepositorioActaDetalle;
import com.gestoracad.repository.RepositorioEstudiante;
import com.gestoracad.repository.RepositorioMatricula;
import com.gestoracad.repository.RepositorioParametroSistema;
import com.gestoracad.repository.RepositorioPrerrequisitoCurso;
import com.gestoracad.repository.RepositorioSeccion;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioMatricula;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Implementación de la matrícula de estudiantes en secciones.
 * Aplica cupo, duplicidad de curso, créditos máximos y ventana de matrícula.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioMatriculaImpl implements ServicioMatricula {

    private static final String MODULE = "MATRICULA";
    private static final String BASE_ENDPOINT = "/api/v1/enrollments";
    private static final String ENTITY = "tb_matriculas";
    private static final String PARAM_MAX_CREDITS = "MAX_CREDITOS_POR_PERIODO";
    private static final String PARAM_EXTEMPORANEA = "PERMITE_MATRICULA_EXTEMPORANEA";
    private static final Set<String> ESTADOS = Set.of("MATRICULADO", "RETIRADO");

    private final RepositorioMatricula enrollmentRepository;
    private final RepositorioEstudiante studentRepository;
    private final RepositorioSeccion sectionRepository;
    private final RepositorioParametroSistema parameterRepository;
    private final RepositorioPrerrequisitoCurso prerequisiteRepository;
    private final RepositorioActaDetalle actaDetailRepository;
    private final MapeadorMatricula enrollmentMapper;
    private final ServicioAuditoria auditService;

    public ServicioMatriculaImpl(RepositorioMatricula enrollmentRepository,
                                 RepositorioEstudiante studentRepository,
                                 RepositorioSeccion sectionRepository,
                                 RepositorioParametroSistema parameterRepository,
                                 RepositorioPrerrequisitoCurso prerequisiteRepository,
                                 RepositorioActaDetalle actaDetailRepository,
                                 MapeadorMatricula enrollmentMapper,
                                 ServicioAuditoria auditService) {
        this.enrollmentRepository = enrollmentRepository;
        this.studentRepository = studentRepository;
        this.sectionRepository = sectionRepository;
        this.parameterRepository = parameterRepository;
        this.prerequisiteRepository = prerequisiteRepository;
        this.actaDetailRepository = actaDetailRepository;
        this.enrollmentMapper = enrollmentMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoMatricula> getAllEnrollments() {
        return enrollmentRepository.findAllDetailed()
                .stream()
                .map(enrollmentMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DtoMatricula getEnrollmentById(Long id) {
        return enrollmentRepository.findById(id)
                .map(enrollmentMapper::toDto)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Matrícula", "id", id));
    }

    @Override
    @Transactional
    public DtoMatricula createEnrollment(DtoMatricula dto, String clientIp, String userAgent) {
        Estudiante student = studentRepository.findById(dto.getStudentId())
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Estudiante", "id", dto.getStudentId()));
        if (!student.isActive()) {
            throw new ExcepcionApi("El estudiante está desactivado");
        }
        Seccion section = sectionRepository.findById(dto.getSectionId())
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Sección", "id", dto.getSectionId()));
        if (!section.isActive()) {
            throw new ExcepcionApi("La sección está desactivada");
        }
        PeriodoAcademico period = section.getPeriod();
        if (!period.isActive()) {
            throw new ExcepcionApi("El periodo de la sección está desactivado");
        }

        Matricula existing = enrollmentRepository
                .findByStudentIdAndSectionId(student.getId(), section.getId())
                .orElse(null);
        if (existing != null && existing.isActive()) {
            registerFailure(AccionAuditoria.CREATE,
                    "Intento de duplicar la matrícula del estudiante " + student.getCode() + " en la sección " + section.getCode(),
                    BASE_ENDPOINT, "POST", clientIp, userAgent, existing.getId());
            throw new ExcepcionApi("El estudiante ya está matriculado en esta sección");
        }

        validateEnrollmentWindow(period);
        ensurePrerequisites(student, section, clientIp, userAgent);
        ensureCourseNotEnrolled(student.getId(), section, period);
        ensureCapacity(section);
        ensureCredits(student.getId(), section, period);

        Matricula entity = existing != null ? existing : new Matricula();
        boolean reactivation = existing != null;
        entity.setStudent(student);
        entity.setSection(section);
        entity.setEnrollmentDate(LocalDate.now());
        entity.setStatus("MATRICULADO");
        entity.setObservation(dto.getObservation());
        entity.setActive(true);
        entity.setDeletedAt(null);
        Matricula saved = enrollmentRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(),
                reactivation ? AccionAuditoria.UPDATE : AccionAuditoria.CREATE, MODULE,
                "Matrícula " + (reactivation ? "reactivada" : "registrada") + ": " + student.getCode()
                        + " -> " + section.getCourse().getCode() + "-" + section.getCode(),
                BASE_ENDPOINT, "POST", clientIp, "SUCCESS", userAgent, ENTITY, saved.getId());

        return enrollmentMapper.toDto(saved);
    }

    @Override
    @Transactional
    public DtoMatricula updateStatus(Long id, String status, String clientIp, String userAgent) {
        String normalized = status == null ? "" : status.toUpperCase().trim();
        if (!ESTADOS.contains(normalized)) {
            throw new ExcepcionApi("Estado de matrícula inválido. Use MATRICULADO o RETIRADO");
        }
        Matricula entity = enrollmentRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Matrícula", "id", id));

        if ("MATRICULADO".equals(normalized) && !entity.isActive()) {
            ensurePrerequisites(entity.getStudent(), entity.getSection(), clientIp, userAgent);
            ensureCapacity(entity.getSection());
            ensureCourseNotEnrolled(entity.getStudent().getId(), entity.getSection(), entity.getSection().getPeriod());
            ensureCredits(entity.getStudent().getId(), entity.getSection(), entity.getSection().getPeriod());
        }

        entity.setStatus(normalized);
        entity.setActive("MATRICULADO".equals(normalized));
        entity.setDeletedAt(null);
        Matricula saved = enrollmentRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                "Estado de matrícula actualizado a " + normalized + " para " + entity.getStudent().getCode(),
                BASE_ENDPOINT + "/" + id + "/status", "PATCH", clientIp, "SUCCESS", userAgent, ENTITY, id);

        return enrollmentMapper.toDto(saved);
    }

    @Override
    @Transactional
    public void deleteEnrollment(Long id, String clientIp, String userAgent) {
        Matricula entity = enrollmentRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Matrícula", "id", id));
        entity.setActive(false);
        entity.setStatus("RETIRADO");
        entity.setDeletedAt(java.time.LocalDateTime.now());
        enrollmentRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, MODULE,
                "Matrícula anulada para " + entity.getStudent().getCode(),
                BASE_ENDPOINT + "/" + id, "DELETE", clientIp, "SUCCESS", userAgent, ENTITY, id);
    }

    private void validateEnrollmentWindow(PeriodoAcademico period) {
        if (period.getEnrollmentStart() == null || period.getEnrollmentEnd() == null) {
            return;
        }
        LocalDate today = LocalDate.now();
        boolean inside = !today.isBefore(period.getEnrollmentStart()) && !today.isAfter(period.getEnrollmentEnd());
        if (inside) {
            return;
        }
        boolean extemporaneous = parameterRepository.findByKey(PARAM_EXTEMPORANEA)
                .map(ParametroSistema::getValue)
                .map(String::trim)
                .map(Boolean::parseBoolean)
                .orElse(true);
        if (!extemporaneous) {
            throw new ExcepcionApi("La matrícula está fuera del periodo habilitado y no se permite matrícula extemporánea");
        }
    }

    /**
     * Valida que el estudiante haya aprobado todos los prerrequisitos activos del curso.
     * La aprobación se toma del acta cerrada, no de créditos agregados manualmente.
     */
    private void ensurePrerequisites(Estudiante student, Seccion section, String clientIp, String userAgent) {
        List<PrerrequisitoCurso> prerequisites =
                prerequisiteRepository.findByCourseIdAndActiveTrue(section.getCourse().getId());
        if (prerequisites.isEmpty()) {
            return;
        }

        List<String> missing = prerequisites.stream()
                .map(PrerrequisitoCurso::getPrerequisite)
                .filter(prerequisite -> actaDetailRepository
                        .countApprovedByStudentAndCourse(student.getId(), prerequisite.getId()) == 0)
                .map(prerequisite -> prerequisite.getCode() + " · " + prerequisite.getName())
                .collect(Collectors.toList());

        if (!missing.isEmpty()) {
            String detail = String.join(", ", missing);
            registerFailure(AccionAuditoria.CREATE,
                    "Matrícula rechazada por prerrequisitos no aprobados: " + detail,
                    BASE_ENDPOINT, "POST", clientIp, userAgent, null);
            throw new ExcepcionApi("El estudiante no cumple los prerrequisitos del curso: " + detail);
        }
    }

    private void ensureCourseNotEnrolled(Long studentId, Seccion section, PeriodoAcademico period) {
        long count = enrollmentRepository.countActiveByStudentCoursePeriod(
                studentId, section.getCourse().getId(), period.getId());
        if (count > 0) {
            throw new ExcepcionApi("El estudiante ya tiene una matrícula activa en el curso '"
                    + section.getCourse().getName() + "' para este periodo");
        }
    }

    private void ensureCapacity(Seccion section) {
        long enrolled = enrollmentRepository.countActiveBySectionId(section.getId());
        if (enrolled >= section.getCapacity()) {
            throw new ExcepcionApi("La sección no tiene cupo disponible (" + enrolled + "/" + section.getCapacity() + ")");
        }
    }

    private void ensureCredits(Long studentId, Seccion section, PeriodoAcademico period) {
        int maxCredits = parameterRepository.findByKey(PARAM_MAX_CREDITS)
                .map(ParametroSistema::getValue)
                .map(String::trim)
                .map(value -> {
                    try {
                        return Integer.parseInt(value);
                    } catch (NumberFormatException ex) {
                        return 22;
                    }
                })
                .orElse(22);
        Integer current = enrollmentRepository.sumActiveCreditsByStudentPeriod(studentId, period.getId());
        int total = (current == null ? 0 : current) + section.getCourse().getCredits();
        if (total > maxCredits) {
            throw new ExcepcionApi("La matrícula excede el máximo de " + maxCredits
                    + " créditos por periodo (actual: " + (current == null ? 0 : current)
                    + ", nuevo total: " + total + ")");
        }
    }

    private void registerFailure(AccionAuditoria action, String description, String endpoint,
                                 String method, String clientIp, String userAgent, Long entityId) {
        auditService.log(UtilidadesSeguridad.getCurrentUsername(), action, MODULE, description,
                endpoint, method, clientIp, "FAILURE", userAgent, ENTITY, entityId);
    }
}
