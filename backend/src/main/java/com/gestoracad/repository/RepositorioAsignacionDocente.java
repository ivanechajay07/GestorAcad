package com.gestoracad.repository;

import com.gestoracad.entity.AsignacionDocente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio JPA para la entidad AsignacionDocente.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioAsignacionDocente extends JpaRepository<AsignacionDocente, Long> {

    List<AsignacionDocente> findByTeacherIdOrderByPeriodDescCourseAsc(Long teacherId);

    boolean existsByTeacherIdAndPeriodAndCourseCode(Long teacherId, String period, String courseCode);

    long countByTeacherIdAndActiveTrue(Long teacherId);

    @Query("SELECT COALESCE(SUM(a.theoryHours + a.practiceHours), 0) FROM AsignacionDocente a "
            + "WHERE a.teacher.id = :teacherId AND a.active = true")
    int sumWeeklyLoadByTeacherId(@Param("teacherId") Long teacherId);
}
