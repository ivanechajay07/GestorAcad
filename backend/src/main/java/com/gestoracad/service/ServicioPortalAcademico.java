package com.gestoracad.service;

import com.gestoracad.dto.DtoPortalDocente;
import com.gestoracad.dto.DtoPortalEstudiante;

import java.util.List;

/**
 * Contrato de portales acotados por la identidad de la cuenta.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioPortalAcademico {

    DtoPortalEstudiante getStudentSummary();

    List<DtoPortalEstudiante.Curso> getStudentHistory();

    DtoPortalDocente getTeacherSummary();
}
