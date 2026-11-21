package com.gestoracad.repository;

import com.gestoracad.entity.Autoridad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio JPA para la entidad Autoridad.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioAutoridad extends JpaRepository<Autoridad, Long> {

    List<Autoridad> findAllByOrderByPositionAsc();

    List<Autoridad> findByUniversityIdOrderByPositionAsc(Long universityId);

    boolean existsByPositionAndUniversityId(String position, Long universityId);
}
