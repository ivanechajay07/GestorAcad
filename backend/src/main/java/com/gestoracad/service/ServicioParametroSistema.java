package com.gestoracad.service;

import com.gestoracad.dto.DtoParametroSistema;

import java.util.List;

/**
 * Servicio de gestión de parámetros de configuración del sistema.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioParametroSistema {

    List<DtoParametroSistema> getAllParameters();

    DtoParametroSistema getParameterByKey(String key);

    DtoParametroSistema createParameter(DtoParametroSistema dto, String clientIp, String userAgent);

    DtoParametroSistema updateParameter(Long id, DtoParametroSistema dto, String clientIp, String userAgent);

    void deleteParameter(Long id, String clientIp, String userAgent);
}
