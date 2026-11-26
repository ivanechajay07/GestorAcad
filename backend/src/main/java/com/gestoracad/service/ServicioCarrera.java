package com.gestoracad.service;

import com.gestoracad.dto.DtoCarrera;

import java.util.List;

/**
 * Servicio de gestión del catálogo de carreras profesionales.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioCarrera {

    List<DtoCarrera> getAllCareers();

    List<DtoCarrera> getCareersByFaculty(Long facultyId);

    DtoCarrera getCareerById(Long id);

    DtoCarrera createCareer(DtoCarrera dto, String clientIp, String userAgent);

    DtoCarrera updateCareer(Long id, DtoCarrera dto, String clientIp, String userAgent);

    void deleteCareer(Long id, String clientIp, String userAgent);
}
