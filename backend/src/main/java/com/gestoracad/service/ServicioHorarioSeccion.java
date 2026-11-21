package com.gestoracad.service;

import com.gestoracad.dto.DtoHorarioSeccion;

import java.util.List;

/**
 * Contrato de horarios estructurados por sección.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioHorarioSeccion {

    List<DtoHorarioSeccion> getSchedules(Long sectionId);

    DtoHorarioSeccion addSchedule(Long sectionId, DtoHorarioSeccion dto, String clientIp, String userAgent);

    void removeSchedule(Long sectionId, Long scheduleId, String clientIp, String userAgent);
}
