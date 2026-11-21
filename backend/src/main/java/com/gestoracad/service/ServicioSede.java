package com.gestoracad.service;

import com.gestoracad.dto.DtoSede;

import java.util.List;

/**
 * Servicio de gestión de sedes (campus).
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioSede {

    List<DtoSede> getAllCampuses();

    List<DtoSede> getCampusesByUniversity(Long universityId);

    DtoSede getCampusById(Long id);

    DtoSede createCampus(DtoSede dto, String clientIp, String userAgent);

    DtoSede updateCampus(Long id, DtoSede dto, String clientIp, String userAgent);

    void deleteCampus(Long id, String clientIp, String userAgent);
}
