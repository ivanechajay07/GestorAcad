package com.gestoracad.repository;

import com.gestoracad.entity.Facultad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para el catálogo de facultades.
 * La facultad es la raíz de la jerarquía académica: agrupa carreras y es
 * referenciada por estudiantes y docentes.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioFacultad extends JpaRepository<Facultad, Long> {

    Optional<Facultad> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    List<Facultad> findAllByOrderByNameAsc();
}
