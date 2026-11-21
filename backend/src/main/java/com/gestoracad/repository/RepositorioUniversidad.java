package com.gestoracad.repository;

import com.gestoracad.entity.Universidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repositorio JPA para la entidad Universidad.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioUniversidad extends JpaRepository<Universidad, Long> {

    Optional<Universidad> findByShortName(String shortName);

    boolean existsByTaxId(String taxId);

    Optional<Universidad> findFirstByActiveTrueOrderByIdAsc();
}
