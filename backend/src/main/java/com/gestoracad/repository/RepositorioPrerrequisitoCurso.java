package com.gestoracad.repository;

import com.gestoracad.entity.PrerrequisitoCurso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio de prerrequisitos entre cursos.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioPrerrequisitoCurso extends JpaRepository<PrerrequisitoCurso, Long> {

    List<PrerrequisitoCurso> findByCourseIdAndActiveTrue(Long courseId);

    Optional<PrerrequisitoCurso> findByCourseIdAndPrerequisiteId(Long courseId, Long prerequisiteId);

    Optional<PrerrequisitoCurso> findByIdAndCourseId(Long id, Long courseId);

    boolean existsByCourseIdAndPrerequisiteIdAndActiveTrue(Long courseId, Long prerequisiteId);
}
