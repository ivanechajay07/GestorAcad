package com.gestoracad.service;

import com.gestoracad.dto.DtoSeccion;

import java.util.List;

/**
 * Contrato del servicio de secciones.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioSeccion {

    List<DtoSeccion> getAllSections();

    DtoSeccion getSectionById(Long id);

    DtoSeccion createSection(DtoSeccion dto, String clientIp, String userAgent);

    DtoSeccion updateSection(Long id, DtoSeccion dto, String clientIp, String userAgent);

    void deleteSection(Long id, String clientIp, String userAgent);
}
