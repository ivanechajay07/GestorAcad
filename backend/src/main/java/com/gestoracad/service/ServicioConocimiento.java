package com.gestoracad.service;

import com.gestoracad.dto.DtoFuenteConocimiento;
import com.gestoracad.dto.DtoGuardarConocimiento;
import com.gestoracad.dto.DtoRespuestaAsistente;

import java.util.List;

/**
 * Contrato de la base de conocimiento y del asistente académico local.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioConocimiento {

    List<DtoFuenteConocimiento> listSources();

    DtoFuenteConocimiento createSource(DtoGuardarConocimiento dto, String clientIp, String userAgent);

    void deleteSource(Long id, String clientIp, String userAgent);

    DtoRespuestaAsistente ask(String question);
}
