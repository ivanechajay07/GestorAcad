package com.gestoracad.repository;

import com.gestoracad.entity.Calificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio de calificaciones.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioCalificacion extends JpaRepository<Calificacion, Long> {

    List<Calificacion> findByEvaluationIdAndActiveTrue(Long evaluationId);

    Optional<Calificacion> findByEvaluationIdAndStudentId(Long evaluationId, Long studentId);

    @Query("SELECT c FROM Calificacion c JOIN FETCH c.evaluation e JOIN FETCH c.student s "
            + "WHERE e.section.id = :sectionId AND c.active = true")
    List<Calificacion> findActiveBySectionId(@Param("sectionId") Long sectionId);
}
