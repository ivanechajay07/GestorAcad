package com.gestoracad.repository;

import com.gestoracad.entity.ActaDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio de detalles de acta.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioActaDetalle extends JpaRepository<ActaDetalle, Long> {

    List<ActaDetalle> findByActaId(Long actaId);

    @Query("SELECT COUNT(d) FROM ActaDetalle d WHERE d.student.id = :studentId "
            + "AND d.acta.section.course.id = :courseId AND d.acta.status = 'CERRADA' "
            + "AND d.approved = true AND d.active = true")
    long countApprovedByStudentAndCourse(@Param("studentId") Long studentId,
                                         @Param("courseId") Long courseId);
}
