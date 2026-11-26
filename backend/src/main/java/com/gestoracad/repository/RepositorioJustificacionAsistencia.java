package com.gestoracad.repository;

import com.gestoracad.entity.JustificacionAsistencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio de justificaciones de asistencia.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioJustificacionAsistencia extends JpaRepository<JustificacionAsistencia, Long> {

    Optional<JustificacionAsistencia> findByAttendanceIdAndActiveTrue(Long attendanceId);

    List<JustificacionAsistencia> findBySectionIdAndActiveTrueOrderByCreatedAtDesc(Long sectionId);

    List<JustificacionAsistencia> findBySectionIdAndStatusAndActiveTrueOrderByCreatedAtDesc(Long sectionId, String status);

    long countBySectionIdAndStatusAndActiveTrue(Long sectionId, String status);

    List<JustificacionAsistencia> findByStudentIdAndActiveTrueOrderByCreatedAtDesc(Long studentId);
}
