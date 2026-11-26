package com.gestoracad.repository;

/**
 * Proyección DAO para agregaciones agrupadas por una etiqueta de texto.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ProyeccionConteoTexto {

    String getEtiqueta();

    long getTotal();
}
