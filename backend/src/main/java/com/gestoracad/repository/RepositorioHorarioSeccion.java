package com.gestoracad.repository;

import com.gestoracad.entity.HorarioSeccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio de bloques horarios por sección.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioHorarioSeccion extends JpaRepository<HorarioSeccion, Long> {

    List<HorarioSeccion> findBySectionIdAndActiveTrueOrderByDayAscStartTimeAsc(Long sectionId);

    Optional<HorarioSeccion> findByIdAndSectionId(Long id, Long sectionId);

    @Query("SELECT h FROM HorarioSeccion h JOIN FETCH h.section s LEFT JOIN FETCH s.teacher "
            + "WHERE s.period.id = :periodId AND h.day = :day AND h.active = true "
            + "AND h.startTime < :endTime AND h.endTime > :startTime")
    List<HorarioSeccion> findOverlapping(@Param("periodId") Long periodId,
                                         @Param("day") String day,
                                         @Param("startTime") LocalTime startTime,
                                         @Param("endTime") LocalTime endTime);
}
