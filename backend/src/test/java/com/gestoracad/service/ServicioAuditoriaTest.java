package com.gestoracad.service;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoConteoAuditoria;
import com.gestoracad.dto.DtoResumenAuditoria;
import com.gestoracad.mapper.MapeadorRegistroAuditoria;
import com.gestoracad.repository.ProyeccionConteoAccion;
import com.gestoracad.repository.RepositorioRegistroAuditoria;
import com.gestoracad.repository.RepositorioUsuario;
import com.gestoracad.service.impl.ServicioAuditoriaImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Pruebas unitarias del resumen de actividad de auditoría.
 * Verifican la aggregación por día institucional, los indicadores derivados,
 * la comparación con el periodo anterior y el acotado de la ventana.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@ExtendWith(MockitoExtension.class)
class ServicioAuditoriaTest {

    private static final ZoneId ZONA_LIMA = ZoneId.of("America/Lima");

    @Mock
    private RepositorioRegistroAuditoria auditRepository;
    @Mock
    private RepositorioUsuario userRepository;
    @Mock
    private MapeadorRegistroAuditoria auditMapper;

    @InjectMocks
    private ServicioAuditoriaImpl service;

    private static ProyeccionConteoAccion accion(AccionAuditoria accion, long total) {
        return new ProyeccionConteoAccion() {
            @Override
            public AccionAuditoria getAccion() {
                return accion;
            }

            @Override
            public long getTotal() {
                return total;
            }
        };
    }

    /** Convierte una hora de Lima a la hora local con la que se persiste en la base. */
    private static LocalDateTime enHoraServidor(LocalDate diaLima, int hora, int minuto) {
        return diaLima.atTime(hora, minuto)
                .atZone(ZONA_LIMA)
                .withZoneSameInstant(ZoneId.systemDefault())
                .toLocalDateTime();
    }

    @Test
    @DisplayName("Calcula totales, promedio, pico diario y variación frente al periodo anterior")
    void calculaIndicadoresDelPeriodo() {
        LocalDate hoy = LocalDate.now(ZONA_LIMA);
        LocalDateTime marcaReciente = enHoraServidor(hoy, 12, 0);
        LocalDateTime otraMarca = enHoraServidor(hoy, 13, 0);
        LocalDateTime marcaAntigua = enHoraServidor(hoy.minusDays(2), 10, 0);

        when(auditRepository.findTimestampsBetween(any(), any()))
                .thenReturn(List.of(marcaAntigua, marcaReciente, otraMarca));
        when(auditRepository.countByResultBetween(eq("SUCCESS"), any(), any())).thenReturn(2L);
        when(auditRepository.countBetween(any(), any())).thenReturn(4L);
        when(auditRepository.countByActionBetween(any(), any()))
                .thenReturn(List.of(accion(AccionAuditoria.LOGIN, 2), accion(AccionAuditoria.CREATE, 1)));

        DtoResumenAuditoria resumen = service.getSummary(7);

        assertEquals(7, resumen.getDias());
        assertEquals(hoy.minusDays(6).toString(), resumen.getDesde());
        assertEquals(hoy.toString(), resumen.getHasta());
        assertEquals(3L, resumen.getTotal());
        assertEquals(2L, resumen.getExitos());
        assertEquals(1L, resumen.getFallos());
        assertEquals(0.43, resumen.getPromedioDiario());
        assertEquals(4L, resumen.getTotalPeriodoAnterior());
        assertEquals(-25.0, resumen.getVariacionPorcentual());
        assertEquals(hoy.toString(), resumen.getDiaMasActivoFecha());
        assertEquals(2L, resumen.getEventosDiaMasActivo());
        assertEquals(7, resumen.getPorDia().size());
        assertEquals(2L, resumen.getPorDia().get(6).getTotal());
        assertEquals(1L, resumen.getPorDia().get(4).getTotal());
        assertEquals("LOGIN", resumen.getPorAccion().get(0).getClave());
        assertEquals(2L, resumen.getPorAccion().get(0).getTotal());
        assertNotNull(resumen.getGeneradoEn());
    }

    @Test
    @DisplayName("Acota la ventana a 90 días y rellena los días sin eventos en cero")
    void acotaLaVentanaYCompletaDias() {
        LocalDate hoy = LocalDate.now(ZONA_LIMA);
        when(auditRepository.findTimestampsBetween(any(), any())).thenReturn(List.of());
        when(auditRepository.countByResultBetween(anyString(), any(), any())).thenReturn(0L);
        when(auditRepository.countBetween(any(), any())).thenReturn(0L);
        when(auditRepository.countByActionBetween(any(), any())).thenReturn(List.of());

        DtoResumenAuditoria resumen = service.getSummary(500);

        assertEquals(90, resumen.getDias());
        assertEquals(90, resumen.getPorDia().size());
        assertEquals(hoy.minusDays(89).toString(), resumen.getPorDia().get(0).getClave());
        assertEquals(0L, resumen.getPorDia().get(89).getTotal());
        assertEquals(0L, resumen.getTotal());
    }

    @Test
    @DisplayName("Sin eventos ni periodo anterior deja los indicadores comparativos en null")
    void sinEventosDevuelveIndicadoresVacios() {
        when(auditRepository.findTimestampsBetween(any(), any())).thenReturn(List.of());
        when(auditRepository.countByResultBetween(anyString(), any(), any())).thenReturn(0L);
        when(auditRepository.countBetween(any(), any())).thenReturn(0L);
        when(auditRepository.countByActionBetween(any(), any())).thenReturn(List.of());

        DtoResumenAuditoria resumen = service.getSummary(7);

        assertNull(resumen.getDiaMasActivo());
        assertNull(resumen.getDiaMasActivoFecha());
        assertNull(resumen.getVariacionPorcentual());
        assertEquals(0L, resumen.getEventosDiaMasActivo());
        assertEquals(0L, resumen.getPromedioDiario());
        List<DtoConteoAuditoria> porDia = resumen.getPorDia();
        assertEquals(7, porDia.size());
    }

    @Test
    @DisplayName("Agrupa por día de Lima aunque la marca del servidor esté en otra zona")
    void agrupaPorDiaInstitucional() {
        LocalDate hoy = LocalDate.now(ZONA_LIMA);
        // 23:30 en Lima del día anterior cae en el penúltimo día de la ventana.
        LocalDateTime marca = enHoraServidor(hoy.minusDays(1), 23, 30);

        when(auditRepository.findTimestampsBetween(any(), any())).thenReturn(List.of(marca));
        when(auditRepository.countByResultBetween(anyString(), any(), any())).thenReturn(1L);
        when(auditRepository.countBetween(any(), any())).thenReturn(0L);
        when(auditRepository.countByActionBetween(any(), any())).thenReturn(List.of());

        DtoResumenAuditoria resumen = service.getSummary(7);

        assertEquals(0L, resumen.getPorDia().get(6).getTotal());
        assertEquals(1L, resumen.getPorDia().get(5).getTotal());
    }
}
