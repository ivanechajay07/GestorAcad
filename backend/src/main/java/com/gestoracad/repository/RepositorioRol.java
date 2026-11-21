package com.gestoracad.repository;

import com.gestoracad.entity.Rol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repositorio JPA para la entidad Rol.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioRol extends JpaRepository<Rol, Long> {
    Optional<Rol> findByName(String name);
    boolean existsByName(String name);
}
