package com.gestoracad.repository;

import com.gestoracad.entity.Carrera;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para el catálogo de carreras profesionales.
 * Cada carrera pertenece a una facultad y es referenciada por los estudiantes.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioCarrera extends JpaRepository<Carrera, Long> {

    Optional<Carrera> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    List<Carrera> findAllByOrderByNameAsc();

    List<Carrera> findByFacultyIdOrderByNameAsc(Long facultyId);

    long countByFacultyIdAndActiveTrue(Long facultyId);
}
