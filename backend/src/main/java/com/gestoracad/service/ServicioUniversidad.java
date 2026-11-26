package com.gestoracad.service;

import com.gestoracad.dto.DtoUniversidad;

import java.util.List;

/**
 * Servicio de gestión de la información institucional de la universidad.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioUniversidad {

    List<DtoUniversidad> getAllUniversities();

    DtoUniversidad getUniversityById(Long id);

    DtoUniversidad getActiveUniversity();

    DtoUniversidad createUniversity(DtoUniversidad dto, String clientIp, String userAgent);

    DtoUniversidad updateUniversity(Long id, DtoUniversidad dto, String clientIp, String userAgent);

    void toggleUniversityStatus(Long id, boolean active, String clientIp, String userAgent);
}
