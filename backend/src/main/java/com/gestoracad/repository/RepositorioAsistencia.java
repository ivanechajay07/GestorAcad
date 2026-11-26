package com.gestoracad.repository;

import com.gestoracad.entity.Asistencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio de asistencia.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioAsistencia extends JpaRepository<Asistencia, Long> {

    List<Asistencia> findBySectionIdAndDateAndActiveTrue(Long sectionId, LocalDate date);

    Optional<Asistencia> findBySectionIdAndStudentIdAndDate(Long sectionId, Long studentId, LocalDate date);

    List<Asistencia> findBySectionIdAndStudentIdAndActiveTrue(Long sectionId, Long studentId);
}
