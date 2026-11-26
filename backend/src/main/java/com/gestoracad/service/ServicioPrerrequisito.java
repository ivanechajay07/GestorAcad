package com.gestoracad.service;

import com.gestoracad.dto.DtoPrerrequisito;

import java.util.List;

/**
 * Contrato de prerrequisitos académicos.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioPrerrequisito {

    List<DtoPrerrequisito> getPrerequisites(Long courseId);

    DtoPrerrequisito addPrerequisite(Long courseId, Long prerequisiteId, String clientIp, String userAgent);

    void removePrerequisite(Long courseId, Long prerequisiteId, String clientIp, String userAgent);
}
