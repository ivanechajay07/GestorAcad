package com.gestoracad.repository;

import com.gestoracad.entity.PlanCurso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA de la malla curricular.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioPlanCurso extends JpaRepository<PlanCurso, Long> {

    List<PlanCurso> findByPlanIdAndActiveTrueOrderByCycleAscCourseCodeAsc(Long planId);

    Optional<PlanCurso> findByIdAndPlanId(Long id, Long planId);

    Optional<PlanCurso> findByPlanIdAndCourseId(Long planId, Long courseId);

    boolean existsByPlanIdAndCourseIdAndActiveTrue(Long planId, Long courseId);

    long countByPlanIdAndActiveTrue(Long planId);

    @Query("SELECT COALESCE(SUM(pc.course.credits), 0) FROM PlanCurso pc "
            + "WHERE pc.plan.id = :planId AND pc.active = true")
    Integer sumCreditsByPlanId(@Param("planId") Long planId);
}
