package com.gestoracad.service;

import com.gestoracad.dto.DtoMatricula;

import java.util.List;

/**
 * Contrato del servicio de matrículas.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioMatricula {

    List<DtoMatricula> getAllEnrollments();

    DtoMatricula getEnrollmentById(Long id);

    DtoMatricula createEnrollment(DtoMatricula dto, String clientIp, String userAgent);

    DtoMatricula updateStatus(Long id, String status, String clientIp, String userAgent);

    void deleteEnrollment(Long id, String clientIp, String userAgent);
}
