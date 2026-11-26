package com.gestoracad;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Punto de entrada de la aplicación backend del Gestor Académico Virtual.
 * Inicializa el contexto de Spring Boot y levanta la API REST.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@SpringBootApplication
public class AplicacionGestorAcademico {

	/** Método principal que arranca la aplicación Spring Boot. */
	public static void main(String[] args) {
		SpringApplication.run(AplicacionGestorAcademico.class, args);
	}

}
