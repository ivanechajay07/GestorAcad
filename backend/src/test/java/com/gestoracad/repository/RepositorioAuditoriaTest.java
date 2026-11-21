package com.gestoracad.repository;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.config.ConfiguracionAuditoriaJpa;
import com.gestoracad.entity.RegistroAuditoria;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.AuditorAware;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pruebas de las consultas de agregación del resumen de auditoría.
 * Verifican los conteos, la ventana semiabierta y la proyección por acción
 * directamente contra la base de datos en memoria.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@DataJpaTest
@ActiveProfiles("test")
@Import({ConfiguracionAuditoriaJpa.class, RepositorioAuditoriaTest.AuditoriaTestConfig.class})
class RepositorioAuditoriaTest {

    @TestConfiguration
    static class AuditoriaTestConfig {
        @Bean(name = "auditorActualImpl")
        AuditorAware<String> auditorActualImpl() {
            return () -> Optional.of("JUNIT");
        }
    }

    @Autowired
    private RepositorioRegistroAuditoria auditRepository;

    private static final LocalDateTime INICIO = LocalDateTime.of(2026, 10, 28, 0, 0);
    private static final LocalDateTime FIN = LocalDateTime.of(2026, 10, 29, 0, 0);

    private void evento(String username, AccionAuditoria accion, String resultado, LocalDateTime timestamp) {
        RegistroAuditoria log = new RegistroAuditoria(null, username, accion, "SEGURIDAD",
                "Evento de prueba", "/api/v1/audit/recent", "GET", "203.0.113.9", resultado);
        log.setTimestamp(timestamp);
        auditRepository.save(log);
    }

    @BeforeEach
    void setUp() {
        evento("admin.rectoria", AccionAuditoria.LOGIN, "SUCCESS", INICIO.plusHours(9));
        evento("carlos.santana", AccionAuditoria.LOGIN, "SUCCESS", INICIO.plusHours(10));
        evento("admin.rectoria", AccionAuditoria.CREATE, "FAILURE", INICIO.plusHours(11));
        evento("admin.rectoria", AccionAuditoria.VIEW, "SUCCESS", FIN);
    }

    @Test
    @DisplayName("Cuenta la ventana semiabierta y separa éxitos de fallos")
    void cuentaPorVentanaYResultado() {
        assertEquals(3L, auditRepository.countBetween(INICIO, FIN));
        assertEquals(2L, auditRepository.countByResultBetween("SUCCESS", INICIO, FIN));
        assertEquals(1L, auditRepository.countByResultBetween("FAILURE", INICIO, FIN));
    }

    @Test
    @DisplayName("Devuelve las marcas de la ventana en orden ascendente")
    void recuperaMarcasEnOrden() {
        List<LocalDateTime> marcas = auditRepository.findTimestampsBetween(INICIO, FIN);

        assertEquals(3, marcas.size());
        assertTrue(marcas.get(0).isBefore(marcas.get(1)));
        assertTrue(marcas.get(1).isBefore(marcas.get(2)));
        assertTrue(marcas.stream().allMatch(marca -> marca.isBefore(FIN)));
    }

    @Test
    @DisplayName("Agrupa por acción con la proyección tipada y ordena por total descendente")
    void agrupaPorAccion() {
        Map<AccionAuditoria, Long> totales = auditRepository.countByActionBetween(INICIO, FIN)
                .stream()
                .collect(Collectors.toMap(
                        ProyeccionConteoAccion::getAccion,
                        ProyeccionConteoAccion::getTotal,
                        Long::sum,
                        java.util.LinkedHashMap::new));

        // El evento VIEW cae exactamente en FIN, por lo que la ventana semiabierta lo excluye.
        assertEquals(2, totales.size());
        assertEquals(2L, totales.get(AccionAuditoria.LOGIN));
        assertEquals(1L, totales.get(AccionAuditoria.CREATE));
        assertFalse(totales.containsKey(AccionAuditoria.VIEW));
        assertEquals(AccionAuditoria.LOGIN, auditRepository.countByActionBetween(INICIO, FIN).get(0).getAccion());
    }
}
