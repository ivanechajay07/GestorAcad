package com.gestoracad.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Configuración de la documentación OpenAPI (Swagger UI).
 * Define la información general de la API, los tags por dominio y el esquema de
 * seguridad Bearer (JWT).
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Configuration
public class ConfiguracionOpenApi {

    private static final String SECURITY_SCHEME_NAME = "BearerAuth";

    /** Define la configuración de OpenAPI (título, versión, servidores y esquema de seguridad JWT). */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Gestor Académico Virtual API")
                        .version("1.0.0 - Fases 1-6")
                        .description("Documentación oficial de los servicios REST de la plataforma Gestor Académico Virtual. " +
                                "Diseñado bajo arquitectura limpia, modular y segura. Incluye autenticación JWT, " +
                                "autorización por permisos MODULO_ACCION, auditoría de operaciones, límite de intentos de " +
                                "login y cabeceras de seguridad.")
                        .contact(new Contact()
                                .name("Equipo de Desarrollo Gestor Académico")
                                .email("dev@gestoracad.edu"))
                        .license(new License()
                                .name("Uso Académico e Institucional")
                                .url("https://gestoracad.edu/licencia")))
                .tags(List.of(
                        new Tag().name("Autenticación").description("Login, logout, perfil y cambio de contraseña."),
                        new Tag().name("Seguridad").description("Usuarios, roles, permisos y auditoría."),
                        new Tag().name("Universidad").description("Institución matriz, sedes, autoridades y parámetros."),
                        new Tag().name("Docentes").description("Claustro, especialidades y carga lectiva."),
                        new Tag().name("Estudiantes").description("Padrón estudiantil e historial de ingreso."),
                        new Tag().name("Salud").description("Endpoints de diagnóstico y monitoreo.")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .name(SECURITY_SCHEME_NAME)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Ingrese el token JWT con prefijo Bearer para autenticar las solicitudes")));
    }
}
