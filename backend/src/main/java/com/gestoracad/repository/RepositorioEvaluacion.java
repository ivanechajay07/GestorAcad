package com.gestoracad.repository;

import com.gestoracad.entity.Evaluacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio de evaluaciones.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioEvaluacion extends JpaRepository<Evaluacion, Long> {

    List<Evaluacion> findBySectionIdAndActiveTrueOrderByDateAscIdAsc(Long sectionId);

    boolean existsBySectionIdAndNameIgnoreCase(Long sectionId, String name);

    Optional<Evaluacion> findByIdAndSectionId(Long id, Long sectionId);

    @Query("SELECT COALESCE(SUM(e.weight), 0) FROM Evaluacion e WHERE e.section.id = :sectionId AND e.active = true")
    BigDecimal sumWeightBySectionId(@Param("sectionId") Long sectionId);
}
