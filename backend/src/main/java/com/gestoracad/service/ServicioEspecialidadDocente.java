package com.gestoracad.service;

import com.gestoracad.dto.DtoEspecialidadDocente;

import java.util.List;

/**
 * Servicio de gestión de especialidades docentes.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioEspecialidadDocente {

    List<DtoEspecialidadDocente> getSpecialtiesByTeacher(Long teacherId);

    DtoEspecialidadDocente getSpecialtyById(Long id);

    DtoEspecialidadDocente createSpecialty(Long teacherId, DtoEspecialidadDocente dto, String clientIp, String userAgent);

    DtoEspecialidadDocente updateSpecialty(Long id, DtoEspecialidadDocente dto, String clientIp, String userAgent);

    void deleteSpecialty(Long id, String clientIp, String userAgent);
}
