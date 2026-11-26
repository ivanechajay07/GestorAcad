package com.gestoracad.service;

import com.gestoracad.dto.DtoAsignacionDocente;

import java.util.List;

/**
 * Servicio de gestión de asignaciones (carga académica) docentes.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioAsignacionDocente {

    List<DtoAsignacionDocente> getAssignmentsByTeacher(Long teacherId);

    DtoAsignacionDocente getAssignmentById(Long id);

    DtoAsignacionDocente createAssignment(Long teacherId, DtoAsignacionDocente dto, String clientIp, String userAgent);

    DtoAsignacionDocente updateAssignment(Long id, DtoAsignacionDocente dto, String clientIp, String userAgent);

    void deleteAssignment(Long id, String clientIp, String userAgent);
}
