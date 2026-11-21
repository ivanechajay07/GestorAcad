package com.gestoracad.service;

import com.gestoracad.dto.DtoDocente;

import java.util.List;

/**
 * Servicio de gestión de docentes.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioDocente {

    List<DtoDocente> getAllTeachers();

    List<DtoDocente> getActiveTeachers();

    DtoDocente getTeacherById(Long id);

    DtoDocente createTeacher(DtoDocente dto, String clientIp, String userAgent);

    DtoDocente updateTeacher(Long id, DtoDocente dto, String clientIp, String userAgent);

    void deleteTeacher(Long id, String clientIp, String userAgent);

    void toggleTeacherStatus(Long id, boolean active, String clientIp, String userAgent);
}
