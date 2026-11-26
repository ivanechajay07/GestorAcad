package com.gestoracad.service;

import com.gestoracad.dto.DtoPeriodoAcademico;

import java.util.List;

/**
 * Contrato del servicio de periodos académicos.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioPeriodoAcademico {

    List<DtoPeriodoAcademico> getAllPeriods();

    DtoPeriodoAcademico getPeriodById(Long id);

    DtoPeriodoAcademico createPeriod(DtoPeriodoAcademico dto, String clientIp, String userAgent);

    DtoPeriodoAcademico updatePeriod(Long id, DtoPeriodoAcademico dto, String clientIp, String userAgent);

    DtoPeriodoAcademico activatePeriod(Long id, String clientIp, String userAgent);

    void deletePeriod(Long id, String clientIp, String userAgent);
}
