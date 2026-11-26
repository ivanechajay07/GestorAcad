package com.gestoracad.service;

import com.gestoracad.dto.DtoAutoridad;

import java.util.List;

/**
 * Servicio de gestión de autoridades institucionales.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioAutoridad {

    List<DtoAutoridad> getAllAuthorities();

    List<DtoAutoridad> getAuthoritiesByUniversity(Long universityId);

    DtoAutoridad getAuthorityById(Long id);

    DtoAutoridad createAuthority(DtoAutoridad dto, String clientIp, String userAgent);

    DtoAutoridad updateAuthority(Long id, DtoAutoridad dto, String clientIp, String userAgent);

    void deleteAuthority(Long id, String clientIp, String userAgent);
}
