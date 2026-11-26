package com.gestoracad.repository;

import com.gestoracad.entity.PeriodoAcademico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA de periodos académicos.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioPeriodoAcademico extends JpaRepository<PeriodoAcademico, Long> {

    List<PeriodoAcademico> findAllByOrderByStartDateDesc();

    Optional<PeriodoAcademico> findByCode(String code);

    boolean existsByCodeIgnoreCase(String code);

    Optional<PeriodoAcademico> findFirstByCurrentTrueAndActiveTrue();

    long countByActiveTrue();

    @Modifying
    @Query("UPDATE PeriodoAcademico p SET p.current = false WHERE p.current = true")
    int clearCurrent();
}
