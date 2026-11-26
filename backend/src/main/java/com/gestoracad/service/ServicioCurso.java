package com.gestoracad.service;

import com.gestoracad.dto.DtoCurso;

import java.util.List;

/**
 * Contrato del servicio del catálogo de cursos.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioCurso {

    List<DtoCurso> getAllCourses();

    DtoCurso getCourseById(Long id);

    DtoCurso createCourse(DtoCurso dto, String clientIp, String userAgent);

    DtoCurso updateCourse(Long id, DtoCurso dto, String clientIp, String userAgent);

    void deleteCourse(Long id, String clientIp, String userAgent);
}
