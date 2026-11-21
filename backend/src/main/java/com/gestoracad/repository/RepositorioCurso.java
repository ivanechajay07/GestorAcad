package com.gestoracad.repository;

import com.gestoracad.entity.Curso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA del catálogo de cursos.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioCurso extends JpaRepository<Curso, Long> {

    List<Curso> findAllByOrderByCodeAsc();

    Optional<Curso> findByCode(String code);

    boolean existsByCodeIgnoreCase(String code);

    long countByActiveTrue();
}
