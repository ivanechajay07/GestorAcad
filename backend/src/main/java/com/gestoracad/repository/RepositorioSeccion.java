package com.gestoracad.repository;

import com.gestoracad.entity.Seccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio JPA de secciones.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioSeccion extends JpaRepository<Seccion, Long> {

    @Query("SELECT s FROM Seccion s JOIN FETCH s.period JOIN FETCH s.course LEFT JOIN FETCH s.teacher "
            + "ORDER BY s.period.startDate DESC, s.course.code ASC, s.code ASC")
    List<Seccion> findAllDetailed();

    boolean existsByPeriodIdAndCourseIdAndCodeIgnoreCase(Long periodId, Long courseId, String code);

    java.util.Optional<Seccion> findByPeriodIdAndCourseIdAndCodeIgnoreCase(Long periodId, Long courseId, String code);

    long countByPeriodIdAndActiveTrue(Long periodId);

    @Query("SELECT s FROM Seccion s JOIN FETCH s.period JOIN FETCH s.course LEFT JOIN FETCH s.teacher "
            + "WHERE s.teacher.id = :teacherId ORDER BY s.period.startDate DESC, s.course.code ASC, s.code ASC")
    List<Seccion> findByTeacherIdDetailed(@Param("teacherId") Long teacherId);
}
