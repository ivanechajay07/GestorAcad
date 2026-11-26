package com.gestoracad.service;

import com.gestoracad.dto.DtoActa;
import com.gestoracad.dto.DtoAsistencia;
import com.gestoracad.dto.DtoCalificacion;
import com.gestoracad.dto.DtoEvaluacion;
import com.gestoracad.dto.DtoSeccionDocente;

import java.time.LocalDate;
import java.util.List;

/**
 * Contrato del portal operativo del docente.
 * Todas las operaciones validan que la sección pertenezca al docente autenticado.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioPortalDocente {

    DtoSeccionDocente getSection(Long sectionId);

    List<DtoEvaluacion> getEvaluations(Long sectionId);

    DtoEvaluacion createEvaluation(Long sectionId, DtoEvaluacion dto, String clientIp, String userAgent);

    DtoEvaluacion updateEvaluation(Long evaluationId, DtoEvaluacion dto, String clientIp, String userAgent);

    List<DtoCalificacion> getGrades(Long evaluationId);

    void saveGrades(Long evaluationId, List<DtoCalificacion> grades, String clientIp, String userAgent);

    List<DtoAsistencia> getAttendance(Long sectionId, LocalDate date);

    List<DtoAsistencia> getAttendanceHistory(Long sectionId);

    void saveAttendance(Long sectionId, LocalDate date, List<DtoAsistencia> attendance,
                        String clientIp, String userAgent);

    DtoActa getActa(Long sectionId);

    DtoActa closeActa(Long sectionId, String clientIp, String userAgent);
}
