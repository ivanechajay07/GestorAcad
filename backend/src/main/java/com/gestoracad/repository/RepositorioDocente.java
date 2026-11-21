package com.gestoracad.repository;

import com.gestoracad.entity.Docente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para la entidad Docente.
 * Incluye agregaciones por categoría y facultad para el panel institucional.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioDocente extends JpaRepository<Docente, Long> {

    Optional<Docente> findByCode(String code);

    Optional<Docente> findByUserId(Long userId);

    boolean existsByCode(String code);

    boolean existsByDocumentId(String documentId);

    Optional<Docente> findFirstByDocumentId(String documentId);

    List<Docente> findAllByOrderByLastNameAscFirstNameAsc();

    long countByActiveTrue();

    long countByFacultyIdAndActiveTrue(Long facultyId);

    @Query("SELECT d.category AS etiqueta, COUNT(d) AS total FROM Docente d "
            + "WHERE d.active = true AND d.category IS NOT NULL AND d.category <> '' "
            + "GROUP BY d.category ORDER BY COUNT(d) DESC, d.category ASC")
    List<ProyeccionConteoTexto> countActiveByCategory();

    @Query("SELECT d.faculty.name AS etiqueta, COUNT(d) AS total FROM Docente d "
            + "WHERE d.active = true AND d.faculty IS NOT NULL "
            + "GROUP BY d.faculty.id, d.faculty.name ORDER BY COUNT(d) DESC, d.faculty.name ASC")
    List<ProyeccionConteoTexto> countActiveByFaculty();
}
