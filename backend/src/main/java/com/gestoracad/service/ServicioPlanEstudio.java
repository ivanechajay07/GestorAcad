package com.gestoracad.service;

import com.gestoracad.dto.DtoPlanCurso;
import com.gestoracad.dto.DtoPlanEstudio;

import java.util.List;

/**
 * Contrato del servicio de planes de estudio y malla curricular.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioPlanEstudio {

    List<DtoPlanEstudio> getAllPlans();

    DtoPlanEstudio getPlanById(Long id);

    List<DtoPlanCurso> getPlanCourses(Long planId);

    DtoPlanEstudio createPlan(DtoPlanEstudio dto, String clientIp, String userAgent);

    DtoPlanEstudio updatePlan(Long id, DtoPlanEstudio dto, String clientIp, String userAgent);

    void deletePlan(Long id, String clientIp, String userAgent);

    DtoPlanCurso addCourse(Long planId, DtoPlanCurso dto, String clientIp, String userAgent);

    void removeCourse(Long planId, Long planCourseId, String clientIp, String userAgent);
}
