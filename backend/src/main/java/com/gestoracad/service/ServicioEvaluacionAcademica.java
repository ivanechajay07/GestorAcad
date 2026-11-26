package com.gestoracad.service;

import com.gestoracad.dto.DtoActa;
import com.gestoracad.dto.DtoAsistencia;
import com.gestoracad.dto.DtoCalificacion;
import com.gestoracad.dto.DtoEvaluacion;

import java.time.LocalDate;
import java.util.List;

/**
 * Contrato de evaluación académica: evaluaciones, notas, asistencia y actas.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioEvaluacionAcademica {

    List<DtoEvaluacion> getEvaluations(Long sectionId);

    DtoEvaluacion createEvaluation(Long sectionId, DtoEvaluacion dto, String clientIp, String userAgent);

    DtoEvaluacion updateEvaluation(Long evaluationId, DtoEvaluacion dto, String clientIp, String userAgent);

    void deleteEvaluation(Long evaluationId, String clientIp, String userAgent);

    List<DtoCalificacion> getGrades(Long evaluationId);

    void saveGrades(Long evaluationId, List<DtoCalificacion> grades, String clientIp, String userAgent);

    List<DtoAsistencia> getAttendance(Long sectionId, LocalDate date);

    void saveAttendance(Long sectionId, LocalDate date, List<DtoAsistencia> attendance, String clientIp, String userAgent);

    DtoActa getActa(Long sectionId);

    DtoActa closeActa(Long sectionId, String clientIp, String userAgent);
}
