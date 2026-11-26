package com.gestoracad.repository;

import com.gestoracad.entity.EspecialidadDocente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio JPA para la entidad EspecialidadDocente.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioEspecialidadDocente extends JpaRepository<EspecialidadDocente, Long> {

    List<EspecialidadDocente> findByTeacherIdOrderByYearDescNameAsc(Long teacherId);

    boolean existsByTeacherIdAndName(Long teacherId, String name);

    long countByTeacherIdAndActiveTrue(Long teacherId);
}
