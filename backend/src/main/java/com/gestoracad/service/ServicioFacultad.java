package com.gestoracad.service;

import com.gestoracad.dto.DtoFacultad;

import java.util.List;

/**
 * Servicio de gestión del catálogo de facultades.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioFacultad {

    List<DtoFacultad> getAllFaculties();

    DtoFacultad getFacultyById(Long id);

    DtoFacultad createFaculty(DtoFacultad dto, String clientIp, String userAgent);

    DtoFacultad updateFaculty(Long id, DtoFacultad dto, String clientIp, String userAgent);

    void deleteFaculty(Long id, String clientIp, String userAgent);
}
