package com.gestoracad.repository;

import com.gestoracad.entity.Matricula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA de matrículas.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioMatricula extends JpaRepository<Matricula, Long> {

    @Query("SELECT m FROM Matricula m JOIN FETCH m.student JOIN FETCH m.section s "
            + "JOIN FETCH s.course JOIN FETCH s.period ORDER BY m.enrollmentDate DESC, m.id DESC")
    List<Matricula> findAllDetailed();

    Optional<Matricula> findByStudentIdAndSectionId(Long studentId, Long sectionId);

    @Query("SELECT m FROM Matricula m JOIN FETCH m.student s WHERE m.section.id = :sectionId "
            + "AND m.active = true ORDER BY s.lastName ASC, s.firstName ASC")
    List<Matricula> findActiveBySectionId(@Param("sectionId") Long sectionId);

    @Query("SELECT m FROM Matricula m JOIN FETCH m.section s JOIN FETCH s.course JOIN FETCH s.period "
            + "WHERE m.student.id = :studentId AND m.active = true ORDER BY s.period.startDate DESC, s.course.code ASC")
    List<Matricula> findActiveByStudentId(@Param("studentId") Long studentId);

    @Query("SELECT m FROM Matricula m JOIN FETCH m.section s JOIN FETCH s.course JOIN FETCH s.period "
            + "WHERE m.student.id = :studentId ORDER BY s.period.startDate DESC, s.course.code ASC, m.id ASC")
    List<Matricula> findAllByStudentIdDetailed(@Param("studentId") Long studentId);

    @Query("SELECT COUNT(m) FROM Matricula m WHERE m.section.id = :sectionId AND m.active = true")
    long countActiveBySectionId(@Param("sectionId") Long sectionId);

    @Query("SELECT COUNT(m) FROM Matricula m WHERE m.section.period.id = :periodId AND m.active = true")
    long countActiveByPeriodId(@Param("periodId") Long periodId);

    @Query("SELECT COUNT(m) FROM Matricula m WHERE m.student.id = :studentId "
            + "AND m.section.course.id = :courseId AND m.section.period.id = :periodId AND m.active = true")
    long countActiveByStudentCoursePeriod(@Param("studentId") Long studentId,
                                          @Param("courseId") Long courseId,
                                          @Param("periodId") Long periodId);

    @Query("SELECT COALESCE(SUM(m.section.course.credits), 0) FROM Matricula m "
            + "WHERE m.student.id = :studentId AND m.section.period.id = :periodId AND m.active = true")
    Integer sumActiveCreditsByStudentPeriod(@Param("studentId") Long studentId,
                                            @Param("periodId") Long periodId);
}
