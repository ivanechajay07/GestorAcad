package com.gestoracad.repository;

/**
 * Proyección DAO con la cantidad de usuarios asignados a cada rol.
 * Permite resolver el conteo en una sola consulta agrupada.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ProyeccionConteoRol {

    Long getRolId();

    long getTotal();
}
