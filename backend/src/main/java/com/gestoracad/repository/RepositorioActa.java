package com.gestoracad.repository;

import com.gestoracad.entity.Acta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repositorio de actas.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioActa extends JpaRepository<Acta, Long> {

    Optional<Acta> findBySectionId(Long sectionId);
}
