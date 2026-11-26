package com.gestoracad.service;

import com.gestoracad.dto.DtoEstudiante;

import java.util.List;

/**
 * Servicio de gestión de estudiantes.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioEstudiante {

    List<DtoEstudiante> getAllStudents();

    List<DtoEstudiante> getActiveStudents();

    DtoEstudiante getStudentById(Long id);

    DtoEstudiante createStudent(DtoEstudiante dto, String clientIp, String userAgent);

    DtoEstudiante updateStudent(Long id, DtoEstudiante dto, String clientIp, String userAgent);

    void deleteStudent(Long id, String clientIp, String userAgent);

    void toggleStudentStatus(Long id, boolean active, String clientIp, String userAgent);
}
