package com.gestoracad.service;

import com.gestoracad.dto.DtoAdmisionEstudiante;

import java.util.List;

/**
 * Servicio de gestión del proceso de admisión de estudiantes.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioAdmisionEstudiante {

    List<DtoAdmisionEstudiante> getAdmissionsByStudent(Long studentId);

    DtoAdmisionEstudiante getAdmissionById(Long id);

    DtoAdmisionEstudiante createAdmission(Long studentId, DtoAdmisionEstudiante dto, String clientIp, String userAgent);

    DtoAdmisionEstudiante updateAdmission(Long id, DtoAdmisionEstudiante dto, String clientIp, String userAgent);

    void deleteAdmission(Long id, String clientIp, String userAgent);
}
