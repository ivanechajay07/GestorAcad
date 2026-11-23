package com.gestoracad.repository;

import com.gestoracad.entity.Estudiante;
import com.gestoracad.entity.Facultad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para la entidad Estudiante.
 * Incluye consultas de agregación para el panel institucional, de modo que el
 * dashboard reciba conteos y no el padrón completo con datos personales.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioEstudiante extends JpaRepository<Estudiante, Long> {

    Optional<Estudiante> findByCode(String code);

    Optional<Estudiante> findByUserId(Long userId);

    boolean existsByCode(String code);

    boolean existsByDocumentId(String documentId);

    Optional<Estudiante> findFirstByDocumentId(String documentId);

    List<Estudiante> findAllByOrderByLastNameAscFirstNameAsc();

    long countByActiveTrue();

    @Query("SELECT COUNT(e) FROM Estudiante e WHERE e.active = true AND e.userId IS NULL")
    long countActiveWithoutAccount();

    @Query("SELECT COUNT(e) FROM Estudiante e WHERE e.active = true AND (e.avatar IS NULL OR TRIM(e.avatar) = '')")
    long countActiveWithoutAvatar();

    @Query("SELECT COUNT(e) FROM Estudiante e WHERE e.active = true AND UPPER(e.condition) = 'OBSERVADO'")
    long countActiveObserved();

    @Query("SELECT COUNT(e) FROM Estudiante e WHERE e.active = true AND e.weightedAverage < :minimum")
    long countActiveBelowAverage(@Param("minimum") java.math.BigDecimal minimum);

    long countByFacultyIdAndActiveTrue(Long facultyId);

    long countByCareerIdAndActiveTrue(Long careerId);

    /**
     * Mantiene coherente la facultad denormalizada del padrón cuando una
     * carrera cambia de facultad. La fuente de verdad sigue siendo el catálogo.
     *
     * @param careerId carrera reasignada
     * @param faculty  nueva facultad de la carrera
     * @return cantidad de estudiantes actualizados
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Estudiante e SET e.faculty = :faculty, e.updatedAt = CURRENT_TIMESTAMP "
            + "WHERE e.career.id = :careerId")
    int syncFacultyByCareerId(@Param("careerId") Long careerId, @Param("faculty") Facultad faculty);

    @Query("SELECT COUNT(DISTINCT e.faculty.id) FROM Estudiante e "
            + "WHERE e.active = true AND e.faculty IS NOT NULL")
    long countActiveFaculties();

    @Query("SELECT COUNT(DISTINCT e.career.id) FROM Estudiante e "
            + "WHERE e.active = true AND e.career IS NOT NULL")
    long countActiveCareers();

    @Query("SELECT e.currentCycle AS etiqueta, COUNT(e) AS total FROM Estudiante e "
            + "WHERE e.active = true AND e.currentCycle IS NOT NULL "
            + "GROUP BY e.currentCycle ORDER BY e.currentCycle ASC")
    List<ProyeccionConteoCiclo> countActiveByCycle();

    @Query("SELECT e.faculty.name AS etiqueta, COUNT(e) AS total FROM Estudiante e "
            + "WHERE e.active = true AND e.faculty IS NOT NULL "
            + "GROUP BY e.faculty.id, e.faculty.name ORDER BY COUNT(e) DESC, e.faculty.name ASC")
    List<ProyeccionConteoTexto> countActiveByFaculty();

    @Query("SELECT e.career.name AS etiqueta, COUNT(e) AS total FROM Estudiante e "
            + "WHERE e.active = true AND e.career IS NOT NULL "
            + "GROUP BY e.career.id, e.career.name ORDER BY COUNT(e) DESC, e.career.name ASC")
    List<ProyeccionConteoTexto> countActiveByCareer();
}
