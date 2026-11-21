package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoPlanCurso;
import com.gestoracad.dto.DtoPlanEstudio;
import com.gestoracad.entity.Carrera;
import com.gestoracad.entity.Curso;
import com.gestoracad.entity.PlanCurso;
import com.gestoracad.entity.PlanEstudio;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.mapper.MapeadorPlanCurso;
import com.gestoracad.mapper.MapeadorPlanEstudio;
import com.gestoracad.repository.RepositorioCarrera;
import com.gestoracad.repository.RepositorioCurso;
import com.gestoracad.repository.RepositorioPlanCurso;
import com.gestoracad.repository.RepositorioPlanEstudio;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioPlanEstudio;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementación de planes de estudio y su malla curricular.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioPlanEstudioImpl implements ServicioPlanEstudio {

    private static final String MODULE = "PLAN";
    private static final String BASE_ENDPOINT = "/api/v1/study-plans";
    private static final String ENTITY = "tb_planes_estudio";

    private final RepositorioPlanEstudio planRepository;
    private final RepositorioPlanCurso planCourseRepository;
    private final RepositorioCarrera careerRepository;
    private final RepositorioCurso courseRepository;
    private final MapeadorPlanEstudio planMapper;
    private final MapeadorPlanCurso planCourseMapper;
    private final ServicioAuditoria auditService;

    public ServicioPlanEstudioImpl(RepositorioPlanEstudio planRepository,
                                   RepositorioPlanCurso planCourseRepository,
                                   RepositorioCarrera careerRepository,
                                   RepositorioCurso courseRepository,
                                   MapeadorPlanEstudio planMapper,
                                   MapeadorPlanCurso planCourseMapper,
                                   ServicioAuditoria auditService) {
        this.planRepository = planRepository;
        this.planCourseRepository = planCourseRepository;
        this.careerRepository = careerRepository;
        this.courseRepository = courseRepository;
        this.planMapper = planMapper;
        this.planCourseMapper = planCourseMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoPlanEstudio> getAllPlans() {
        return planRepository.findAllByOrderByNameAsc()
                .stream()
                .map(this::enrich)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DtoPlanEstudio getPlanById(Long id) {
        return planRepository.findById(id)
                .map(this::enrich)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Plan de estudios", "id", id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoPlanCurso> getPlanCourses(Long planId) {
        if (!planRepository.existsById(planId)) {
            throw new ExcepcionRecursoNoEncontrado("Plan de estudios", "id", planId);
        }
        return planCourseRepository.findByPlanIdAndActiveTrueOrderByCycleAscCourseCodeAsc(planId)
                .stream()
                .map(planCourseMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DtoPlanEstudio createPlan(DtoPlanEstudio dto, String clientIp, String userAgent) {
        String code = normalizeCode(dto.getCode());
        if (planRepository.existsByCodeIgnoreCase(code)) {
            registerFailure(AccionAuditoria.CREATE,
                    "Intento fallido de registrar plan con código duplicado: " + code,
                    BASE_ENDPOINT, "POST", clientIp, userAgent, null);
            throw new ExcepcionApi("El plan '" + code + "' ya se encuentra registrado");
        }

        Carrera career = careerRepository.findById(dto.getCareerId())
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Carrera", "id", dto.getCareerId()));

        PlanEstudio entity = new PlanEstudio();
        planMapper.updateEntity(entity, dto);
        entity.setCode(code);
        entity.setCareer(career);
        entity.setActive(true);
        PlanEstudio saved = planRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                "Plan de estudios registrado: " + saved.getCode() + " (" + career.getName() + ")",
                BASE_ENDPOINT, "POST", clientIp, "SUCCESS", userAgent, ENTITY, saved.getId());

        return enrich(saved);
    }

    @Override
    @Transactional
    public DtoPlanEstudio updatePlan(Long id, DtoPlanEstudio dto, String clientIp, String userAgent) {
        PlanEstudio entity = planRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Plan de estudios", "id", id));

        String code = normalizeCode(dto.getCode());
        if (!code.equalsIgnoreCase(entity.getCode()) && planRepository.existsByCodeIgnoreCase(code)) {
            registerFailure(AccionAuditoria.UPDATE,
                    "Intento fallido de actualizar plan con código duplicado: " + code,
                    BASE_ENDPOINT + "/" + id, "PUT", clientIp, userAgent, id);
            throw new ExcepcionApi("El plan '" + code + "' ya se encuentra registrado");
        }

        Carrera career = careerRepository.findById(dto.getCareerId())
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Carrera", "id", dto.getCareerId()));

        planMapper.updateEntity(entity, dto);
        entity.setCode(code);
        entity.setCareer(career);
        PlanEstudio saved = planRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                "Plan de estudios actualizado: " + saved.getCode(),
                BASE_ENDPOINT + "/" + id, "PUT", clientIp, "SUCCESS", userAgent, ENTITY, saved.getId());

        return enrich(saved);
    }

    @Override
    @Transactional
    public void deletePlan(Long id, String clientIp, String userAgent) {
        PlanEstudio entity = planRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Plan de estudios", "id", id));
        entity.setActive(false);
        entity.setDeletedAt(java.time.LocalDateTime.now());
        planRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, MODULE,
                "Plan de estudios desactivado: " + entity.getCode(),
                BASE_ENDPOINT + "/" + id, "DELETE", clientIp, "SUCCESS", userAgent, ENTITY, id);
    }

    @Override
    @Transactional
    public DtoPlanCurso addCourse(Long planId, DtoPlanCurso dto, String clientIp, String userAgent) {
        PlanEstudio plan = planRepository.findById(planId)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Plan de estudios", "id", planId));
        if (!plan.isActive()) {
            throw new ExcepcionApi("No se puede modificar un plan desactivado");
        }
        Curso course = courseRepository.findById(dto.getCourseId())
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Curso", "id", dto.getCourseId()));
        if (!course.isActive()) {
            throw new ExcepcionApi("No se puede agregar un curso desactivado");
        }

        PlanCurso existing = planCourseRepository.findByPlanIdAndCourseId(planId, course.getId()).orElse(null);
        if (existing != null && existing.isActive()) {
            registerFailure(AccionAuditoria.CREATE,
                    "Intento fallido de duplicar el curso " + course.getCode() + " en el plan " + plan.getCode(),
                    BASE_ENDPOINT + "/" + planId + "/courses", "POST", clientIp, userAgent, planId);
            throw new ExcepcionApi("El curso '" + course.getCode() + "' ya pertenece al plan");
        }
        PlanCurso planCourse = existing != null ? existing : new PlanCurso();

        planCourse.setPlan(plan);
        planCourse.setCourse(course);
        planCourse.setCycle(dto.getCycle());
        planCourse.setMandatory(dto.isMandatory());
        planCourse.setActive(true);
        planCourse.setDeletedAt(null);
        PlanCurso saved = planCourseRepository.save(planCourse);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                "Curso " + course.getCode() + " agregado al plan " + plan.getCode(),
                BASE_ENDPOINT + "/" + planId + "/courses", "POST", clientIp, "SUCCESS", userAgent, "tb_plan_cursos", saved.getId());

        return planCourseMapper.toDto(saved);
    }

    @Override
    @Transactional
    public void removeCourse(Long planId, Long planCourseId, String clientIp, String userAgent) {
        PlanCurso planCourse = planCourseRepository.findByIdAndPlanId(planCourseId, planId)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Curso del plan", "id", planCourseId));
        planCourse.setActive(false);
        planCourse.setDeletedAt(java.time.LocalDateTime.now());
        planCourseRepository.save(planCourse);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, MODULE,
                "Curso retirado del plan: " + planCourse.getCourse().getCode(),
                BASE_ENDPOINT + "/" + planId + "/courses/" + planCourseId, "DELETE", clientIp, "SUCCESS", userAgent, "tb_plan_cursos", planCourseId);
    }

    private DtoPlanEstudio enrich(PlanEstudio plan) {
        DtoPlanEstudio dto = planMapper.toDto(plan);
        if (dto != null) {
            dto.setCourseCount(planCourseRepository.countByPlanIdAndActiveTrue(plan.getId()));
            Integer credits = planCourseRepository.sumCreditsByPlanId(plan.getId());
            dto.setTotalCredits(credits == null ? 0 : credits);
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
