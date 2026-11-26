package com.gestoracad.repository;

import com.gestoracad.entity.Permiso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para la entidad Permiso.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioPermiso extends JpaRepository<Permiso, Long> {
    Optional<Permiso> findByName(String name);
    List<Permiso> findByModule(String module);
    boolean existsByName(String name);
}
