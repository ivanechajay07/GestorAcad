package com.gestoracad.repository;

import com.gestoracad.entity.PlanEstudio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA de planes de estudio.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioPlanEstudio extends JpaRepository<PlanEstudio, Long> {

    List<PlanEstudio> findAllByOrderByNameAsc();

    Optional<PlanEstudio> findByCode(String code);

    Optional<PlanEstudio> findFirstByCareerIdAndActiveTrueOrderByIdDesc(Long careerId);

    boolean existsByCodeIgnoreCase(String code);
}
