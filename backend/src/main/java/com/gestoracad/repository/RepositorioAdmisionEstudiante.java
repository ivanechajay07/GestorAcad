package com.gestoracad.repository;

import com.gestoracad.entity.AdmisionEstudiante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para la entidad AdmisionEstudiante.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioAdmisionEstudiante extends JpaRepository<AdmisionEstudiante, Long> {

    List<AdmisionEstudiante> findByStudentIdOrderByPeriodDescAdmissionDateDesc(Long studentId);

    Optional<AdmisionEstudiante> findFirstByStudentIdAndActiveTrueOrderByPeriodAscAdmissionDateAsc(Long studentId);

    boolean existsByStudentIdAndPeriod(Long studentId, String period);

    long countByStudentIdAndActiveTrue(Long studentId);
}
