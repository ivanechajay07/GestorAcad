package com.gestoracad.service;

import com.gestoracad.dto.DtoActaPreview;
import com.gestoracad.dto.DtoAsistenciaEstudiante;
import com.gestoracad.dto.DtoJustificacionAsistencia;
import com.gestoracad.dto.DtoPortalDocente;
import com.gestoracad.dto.DtoPortalEstudiante;
import com.gestoracad.dto.DtoSolicitudJustificacion;

import java.util.List;

/**
 * Contrato de portales acotados por la identidad de la cuenta.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioPortalAcademico {

    DtoPortalEstudiante getStudentSummary();

    List<DtoPortalEstudiante.Curso> getStudentHistory();

    List<DtoAsistenciaEstudiante> getStudentAttendance(Long sectionId);

    DtoJustificacionAsistencia requestAttendanceJustification(Long attendanceId,
                                                              DtoSolicitudJustificacion dto,
                                                              String clientIp, String userAgent);

    DtoActaPreview getTeacherActaPreview(Long sectionId);

    DtoPortalDocente getTeacherSummary();
}
