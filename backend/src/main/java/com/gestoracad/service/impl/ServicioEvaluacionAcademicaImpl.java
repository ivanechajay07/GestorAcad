package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoActa;
import com.gestoracad.dto.DtoAsistencia;
import com.gestoracad.dto.DtoCalificacion;
import com.gestoracad.dto.DtoEvaluacion;
import com.gestoracad.entity.Acta;
import com.gestoracad.entity.ActaDetalle;
import com.gestoracad.entity.Asistencia;
import com.gestoracad.entity.Calificacion;
import com.gestoracad.entity.Estudiante;
import com.gestoracad.entity.Evaluacion;
import com.gestoracad.entity.Matricula;
import com.gestoracad.entity.ParametroSistema;
import com.gestoracad.entity.Seccion;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.mapper.MapeadorAsistencia;
import com.gestoracad.mapper.MapeadorCalificacion;
import com.gestoracad.mapper.MapeadorEvaluacion;
import com.gestoracad.repository.RepositorioActa;
import com.gestoracad.repository.RepositorioActaDetalle;
import com.gestoracad.repository.RepositorioAsistencia;
import com.gestoracad.repository.RepositorioCalificacion;
import com.gestoracad.repository.RepositorioEvaluacion;
import com.gestoracad.repository.RepositorioMatricula;
import com.gestoracad.repository.RepositorioParametroSistema;
import com.gestoracad.repository.RepositorioSeccion;
import com.gestoracad.repository.RepositorioEstudiante;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioEvaluacionAcademica;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Implementación del ciclo de evaluación: evaluaciones, notas, asistencia y actas.
 * Una vez cerrada el acta, las notas, evaluaciones y asistencia quedan bloqueadas.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioEvaluacionAcademicaImpl implements ServicioEvaluacionAcademica {

    private static final String MODULE = "EVALUACION";
    private static final String ENTITY = "tb_evaluaciones";
    private static final String PARAM_MIN_GRADE = "NOTA_MINIMA_APROBATORIA";
    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final BigDecimal TWENTY = new BigDecimal("20");
    private static final Set<String> ATTENDANCE_STATUS = Set.of("PRESENTE", "AUSENTE", "TARDANZA", "JUSTIFICADO");

    private final RepositorioSeccion sectionRepository;
    private final RepositorioMatricula enrollmentRepository;
    private final RepositorioEvaluacion evaluationRepository;
    private final RepositorioCalificacion gradeRepository;
    private final RepositorioAsistencia attendanceRepository;
    private final RepositorioActa actaRepository;
    private final RepositorioActaDetalle actaDetailRepository;
    private final RepositorioEstudiante studentRepository;
    private final RepositorioParametroSistema parameterRepository;
    private final MapeadorEvaluacion evaluationMapper;
    private final MapeadorCalificacion gradeMapper;
    private final MapeadorAsistencia attendanceMapper;
    private final ServicioAuditoria auditService;

    public ServicioEvaluacionAcademicaImpl(RepositorioSeccion sectionRepository,
                                            RepositorioMatricula enrollmentRepository,
                                            RepositorioEvaluacion evaluationRepository,
                                            RepositorioCalificacion gradeRepository,
                                            RepositorioAsistencia attendanceRepository,
                                            RepositorioActa actaRepository,
                                            RepositorioActaDetalle actaDetailRepository,
                                            RepositorioEstudiante studentRepository,
                                            RepositorioParametroSistema parameterRepository,
                                            MapeadorEvaluacion evaluationMapper,
                                            MapeadorCalificacion gradeMapper,
                                            MapeadorAsistencia attendanceMapper,
                                            ServicioAuditoria auditService) {
        this.sectionRepository = sectionRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.evaluationRepository = evaluationRepository;
        this.gradeRepository = gradeRepository;
        this.attendanceRepository = attendanceRepository;
        this.actaRepository = actaRepository;
        this.actaDetailRepository = actaDetailRepository;
        this.studentRepository = studentRepository;
        this.parameterRepository = parameterRepository;
        this.evaluationMapper = evaluationMapper;
        this.gradeMapper = gradeMapper;
        this.attendanceMapper = attendanceMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoEvaluacion> getEvaluations(Long sectionId) {
        ensureSection(sectionId);
        return evaluationRepository.findBySectionIdAndActiveTrueOrderByDateAscIdAsc(sectionId)
                .stream()
                .map(evaluationMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DtoEvaluacion createEvaluation(Long sectionId, DtoEvaluacion dto, String clientIp, String userAgent) {
        Seccion section = ensureSection(sectionId);
        ensureOpen(sectionId);
        if (evaluationRepository.existsBySectionIdAndNameIgnoreCase(sectionId, dto.getName().trim())) {
            throw new ExcepcionApi("Ya existe una evaluación con ese nombre en la sección");
        }
        BigDecimal total = evaluationRepository.sumWeightBySectionId(sectionId).add(dto.getWeight());
        if (total.compareTo(HUNDRED) > 0) {
            throw new ExcepcionApi("La suma de pesos no puede exceder 100 (actual: " + total + ")");
        }

        Evaluacion entity = new Evaluacion();
        entity.setSection(section);
        evaluationMapper.updateEntity(entity, dto);
        entity.setType(dto.getType().toUpperCase());
        entity.setActive(true);
        Evaluacion saved = evaluationRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                "Evaluación creada: " + saved.getName() + " (" + section.getCourse().getCode() + "-" + section.getCode() + ")",
                "/api/v1/sections/" + sectionId + "/evaluations", "POST", clientIp, "SUCCESS", userAgent,
                ENTITY, saved.getId());

        return evaluationMapper.toDto(saved);
    }

    @Override
    @Transactional
    public DtoEvaluacion updateEvaluation(Long evaluationId, DtoEvaluacion dto, String clientIp, String userAgent) {
        Evaluacion entity = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Evaluación", "id", evaluationId));
        Long sectionId = entity.getSection().getId();
        ensureOpen(sectionId);
        if (!entity.getName().equalsIgnoreCase(dto.getName())
                && evaluationRepository.existsBySectionIdAndNameIgnoreCase(sectionId, dto.getName().trim())) {
            throw new ExcepcionApi("Ya existe una evaluación con ese nombre en la sección");
        }
        BigDecimal total = evaluationRepository.sumWeightBySectionId(sectionId)
                .subtract(entity.getWeight())
                .add(dto.getWeight());
        if (total.compareTo(HUNDRED) > 0) {
            throw new ExcepcionApi("La suma de pesos no puede exceder 100 (actual: " + total + ")");
        }

        evaluationMapper.updateEntity(entity, dto);
        entity.setType(dto.getType().toUpperCase());
        Evaluacion saved = evaluationRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                "Evaluación actualizada: " + saved.getName(),
                "/api/v1/evaluations/" + evaluationId, "PUT", clientIp, "SUCCESS", userAgent, ENTITY, evaluationId);

        return evaluationMapper.toDto(saved);
    }

    @Override
    @Transactional
    public void deleteEvaluation(Long evaluationId, String clientIp, String userAgent) {
        Evaluacion entity = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Evaluación", "id", evaluationId));
        ensureOpen(entity.getSection().getId());
        entity.setActive(false);
        entity.setDeletedAt(java.time.LocalDateTime.now());
        evaluationRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, MODULE,
                "Evaluación desactivada: " + entity.getName(),
                "/api/v1/evaluations/" + evaluationId, "DELETE", clientIp, "SUCCESS", userAgent, ENTITY, evaluationId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoCalificacion> getGrades(Long evaluationId) {
        Evaluacion evaluation = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Evaluación", "id", evaluationId));
        Map<Long, Calificacion> grades = gradeRepository.findByEvaluationIdAndActiveTrue(evaluationId)
                .stream()
                .collect(Collectors.toMap(g -> g.getStudent().getId(), g -> g));

        return enrollmentRepository.findActiveBySectionId(evaluation.getSection().getId())
                .stream()
                .map(Matricula::getStudent)
                .map(student -> {
                    Calificacion grade = grades.get(student.getId());
                    DtoCalificacion dto = new DtoCalificacion();
                    dto.setEvaluationId(evaluationId);
                    dto.setStudentId(student.getId());
                    dto.setStudentCode(student.getCode());
                    dto.setStudentName((student.getFirstName() + " " + student.getLastName()).trim());
                    dto.setScore(grade == null ? null : grade.getScore());
                    dto.setObservation(grade == null ? null : grade.getObservation());
                    dto.setActive(grade == null || grade.isActive());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void saveGrades(Long evaluationId, List<DtoCalificacion> grades, String clientIp, String userAgent) {
        Evaluacion evaluation = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Evaluación", "id", evaluationId));
        Long sectionId = evaluation.getSection().getId();
        ensureOpen(sectionId);
        Set<Long> enrolled = enrolledIds(sectionId);
        BigDecimal max = evaluation.getMaxScore();

        for (DtoCalificacion dto : grades) {
            if (dto.getScore() == null) {
                continue;
            }
            if (!enrolled.contains(dto.getStudentId())) {
                throw new ExcepcionApi("El estudiante " + dto.getStudentId() + " no está matriculado en la sección");
            }
            if (dto.getScore().compareTo(BigDecimal.ZERO) < 0 || dto.getScore().compareTo(max) > 0) {
                throw new ExcepcionApi("La nota debe estar entre 0 y " + max);
            }
            Estudiante student = studentRepository.findById(dto.getStudentId())
                    .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Estudiante", "id", dto.getStudentId()));
            Calificacion entity = gradeRepository.findByEvaluationIdAndStudentId(evaluationId, student.getId())
                    .orElseGet(Calificacion::new);
            entity.setEvaluation(evaluation);
            entity.setStudent(student);
            entity.setScore(dto.getScore());
            entity.setObservation(dto.getObservation());
            entity.setActive(true);
            entity.setDeletedAt(null);
            gradeRepository.save(entity);
        }

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                "Notas registradas en evaluación " + evaluation.getName(),
                "/api/v1/evaluations/" + evaluationId + "/grades", "PUT", clientIp, "SUCCESS", userAgent,
                "tb_calificaciones", evaluationId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoAsistencia> getAttendance(Long sectionId, LocalDate date) {
        ensureSection(sectionId);
        LocalDate target = date == null ? LocalDate.now() : date;
        Map<Long, Asistencia> attendance = attendanceRepository
                .findBySectionIdAndDateAndActiveTrue(sectionId, target)
                .stream()
                .collect(Collectors.toMap(a -> a.getStudent().getId(), a -> a));

        return enrollmentRepository.findActiveBySectionId(sectionId)
                .stream()
                .map(Matricula::getStudent)
                .map(student -> {
                    Asistencia record = attendance.get(student.getId());
                    DtoAsistencia dto = new DtoAsistencia();
                    dto.setSectionId(sectionId);
                    dto.setStudentId(student.getId());
                    dto.setStudentCode(student.getCode());
                    dto.setStudentName((student.getFirstName() + " " + student.getLastName()).trim());
                    dto.setDate(target);
                    dto.setStatus(record == null ? "PRESENTE" : record.getStatus());
                    dto.setObservation(record == null ? null : record.getObservation());
                    dto.setActive(record == null || record.isActive());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void saveAttendance(Long sectionId, LocalDate date, List<DtoAsistencia> attendance,
                               String clientIp, String userAgent) {
        Seccion section = ensureSection(sectionId);
        ensureOpen(sectionId);
        LocalDate target = date == null ? LocalDate.now() : date;
        Set<Long> enrolled = enrolledIds(sectionId);

        for (DtoAsistencia dto : attendance) {
            if (!enrolled.contains(dto.getStudentId())) {
                throw new ExcepcionApi("El estudiante " + dto.getStudentId() + " no está matriculado en la sección");
            }
            String status = dto.getStatus().toUpperCase();
            if (!ATTENDANCE_STATUS.contains(status)) {
                throw new ExcepcionApi("Estado de asistencia inválido: " + dto.getStatus());
            }
            Estudiante student = studentRepository.findById(dto.getStudentId())
                    .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Estudiante", "id", dto.getStudentId()));
            Asistencia entity = attendanceRepository
                    .findBySectionIdAndStudentIdAndDate(sectionId, student.getId(), target)
                    .orElseGet(Asistencia::new);
            entity.setSection(section);
            entity.setStudent(student);
            entity.setDate(target);
            entity.setStatus(status);
            entity.setObservation(dto.getObservation());
            entity.setActive(true);
            entity.setDeletedAt(null);
            attendanceRepository.save(entity);
        }

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                "Asistencia registrada para " + section.getCourse().getCode() + "-" + section.getCode() + " (" + target + ")",
                "/api/v1/sections/" + sectionId + "/attendance", "PUT", clientIp, "SUCCESS", userAgent,
                "tb_asistencias", sectionId);
    }

    @Override
    @Transactional(readOnly = true)
    public DtoActa getActa(Long sectionId) {
        Seccion section = ensureSection(sectionId);
        Acta acta = actaRepository.findBySectionId(sectionId).orElse(null);
        return buildActa(section, acta);
    }

    @Override
    @Transactional
    public DtoActa closeActa(Long sectionId, String clientIp, String userAgent) {
        Seccion section = ensureSection(sectionId);
        Acta acta = actaRepository.findBySectionId(sectionId).orElse(null);
        if (acta != null && "CERRADA".equals(acta.getStatus())) {
            throw new ExcepcionApi("El acta de esta sección ya está cerrada y no puede modificarse");
        }
        List<Evaluacion> evaluations = evaluationRepository
                .findBySectionIdAndActiveTrueOrderByDateAscIdAsc(sectionId);
        if (evaluations.isEmpty()) {
            throw new ExcepcionApi("No se puede cerrar el acta sin evaluaciones registradas");
        }
        BigDecimal weight = evaluationRepository.sumWeightBySectionId(sectionId);
        if (weight.compareTo(HUNDRED) != 0) {
            throw new ExcepcionApi("La suma de pesos debe ser exactamente 100 para cerrar el acta (actual: " + weight + ")");
        }
        List<Matricula> enrolled = enrollmentRepository.findActiveBySectionId(sectionId);
        if (enrolled.isEmpty()) {
            throw new ExcepcionApi("No hay estudiantes matriculados en la sección");
        }

        Map<String, BigDecimal> scores = new HashMap<>();
        gradeRepository.findActiveBySectionId(sectionId).forEach(grade ->
                scores.put(grade.getStudent().getId() + ":" + grade.getEvaluation().getId(), grade.getScore()));

        BigDecimal minGrade = minGrade();
        Acta target = acta != null ? acta : new Acta();
        target.setSection(section);
        Acta savedActa = actaRepository.save(target);

        int credits = section.getCourse().getCredits();
        for (Matricula enrollment : enrolled) {
            Estudiante student = enrollment.getStudent();
            BigDecimal weighted = BigDecimal.ZERO;
            for (Evaluacion evaluation : evaluations) {
                BigDecimal score = scores.get(student.getId() + ":" + evaluation.getId());
                if (score == null) {
                    continue;
                }
                BigDecimal normalized = score
                        .divide(evaluation.getMaxScore(), 4, RoundingMode.HALF_UP)
                        .multiply(TWENTY);
                weighted = weighted.add(
                        normalized.multiply(evaluation.getWeight()).divide(HUNDRED, 4, RoundingMode.HALF_UP));
            }
            BigDecimal average = weighted.setScale(2, RoundingMode.HALF_UP);
            boolean approved = average.compareTo(minGrade) >= 0;

            ActaDetalle detail = new ActaDetalle();
            detail.setActa(savedActa);
            detail.setStudent(student);
            detail.setAverage(average);
            detail.setApproved(approved);
            detail.setCredits(credits);
            detail.setActive(true);
            actaDetailRepository.save(detail);

            if (approved) {
                int current = student.getApprovedCredits() == null ? 0 : student.getApprovedCredits();
                student.setApprovedCredits(current + credits);
                studentRepository.save(student);
            }
        }

        savedActa.setStatus("CERRADA");
        savedActa.setClosedAt(java.time.LocalDateTime.now());
        savedActa.setClosedBy(UtilidadesSeguridad.getCurrentUsername());
        actaRepository.save(savedActa);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                "Acta cerrada: " + section.getCourse().getCode() + "-" + section.getCode(),
                "/api/v1/sections/" + sectionId + "/act/close", "POST", clientIp, "SUCCESS", userAgent,
                "tb_actas", savedActa.getId());

        return buildActa(section, savedActa);
    }

    private DtoActa buildActa(Seccion section, Acta acta) {
        DtoActa dto = new DtoActa();
        dto.setSectionId(section.getId());
        dto.setSectionCode(section.getCode());
        dto.setCourseCode(section.getCourse().getCode());
        dto.setCourseName(section.getCourse().getName());
        if (acta == null) {
            dto.setStatus("ABIERTA");
            return dto;
        }
        dto.setId(acta.getId());
        dto.setStatus(acta.getStatus());
        dto.setClosedAt(acta.getClosedAt());
        dto.setClosedBy(acta.getClosedBy());
        dto.setDetails(actaDetailRepository.findByActaId(acta.getId())
                .stream()
                .map(detail -> {
                    DtoActa.DtoActaDetalle item = new DtoActa.DtoActaDetalle();
                    item.setStudentId(detail.getStudent().getId());
                    item.setStudentCode(detail.getStudent().getCode());
                    item.setStudentName((detail.getStudent().getFirstName() + " "
                            + detail.getStudent().getLastName()).trim());
                    item.setAverage(detail.getAverage());
                    item.setApproved(detail.isApproved());
                    item.setCredits(detail.getCredits());
                    return item;
                })
                .collect(Collectors.toList()));
        return dto;
    }

    private Seccion ensureSection(Long sectionId) {
        return sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Sección", "id", sectionId));
    }

    private void ensureOpen(Long sectionId) {
        actaRepository.findBySectionId(sectionId)
                .filter(acta -> "CERRADA".equals(acta.getStatus()))
                .ifPresent(acta -> {
                    throw new ExcepcionApi("El acta está cerrada: no se pueden modificar notas, asistencia ni evaluaciones");
                });
    }

    private Set<Long> enrolledIds(Long sectionId) {
        return enrollmentRepository.findActiveBySectionId(sectionId)
                .stream()
                .map(Matricula::getStudent)
                .map(Estudiante::getId)
                .collect(Collectors.toCollection(HashSet::new));
    }

    private BigDecimal minGrade() {
        return parameterRepository.findByKey(PARAM_MIN_GRADE)
                .map(ParametroSistema::getValue)
                .map(String::trim)
                .map(value -> {
                    try {
                        return new BigDecimal(value);
                    } catch (NumberFormatException ex) {
                        return new BigDecimal("11");
                    }
                })
                .orElse(new BigDecimal("11"));
    }
}
