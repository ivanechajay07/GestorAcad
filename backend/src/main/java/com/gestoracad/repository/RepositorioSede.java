package com.gestoracad.repository;

import com.gestoracad.entity.Sede;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para la entidad Sede.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioSede extends JpaRepository<Sede, Long> {

    Optional<Sede> findByCode(String code);

    boolean existsByCode(String code);

    List<Sede> findAllByOrderByNameAsc();

    List<Sede> findByUniversityIdOrderByNameAsc(Long universityId);

    long countByUniversityIdAndActiveTrue(Long universityId);
}
