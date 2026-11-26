package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoConteoAuditoria;
import com.gestoracad.dto.DtoRegistroAuditoria;
import com.gestoracad.dto.DtoResumenAuditoria;
import com.gestoracad.entity.RegistroAuditoria;
import com.gestoracad.entity.Usuario;
import com.gestoracad.mapper.MapeadorRegistroAuditoria;
import com.gestoracad.repository.ProyeccionConteoAccion;
import com.gestoracad.repository.RepositorioRegistroAuditoria;
import com.gestoracad.repository.RepositorioUsuario;
import com.gestoracad.service.ServicioAuditoria;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.stream.Collectors;

/**
 * Implementación del servicio de auditoría.
 * Persiste los eventos relevantes en la bitácora y expone los registros recientes.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioAuditoriaImpl implements ServicioAuditoria {

    private static final Logger log = LoggerFactory.getLogger(ServicioAuditoriaImpl.class);

    /** Zona horaria institucional usada para agrupar y presentar la actividad. */
    private static final ZoneId ZONA_INSTITUCIONAL = ZoneId.of("America/Lima");

    /** Ventana máxima admitida para el resumen, para acotar el costo de la consulta. */
    private static final int MAXIMO_DIAS = 90;

    private static final DateTimeFormatter ETIQUETA_DIA =
            DateTimeFormatter.ofPattern("d MMM", Locale.forLanguageTag("es-PE"));

    private final RepositorioRegistroAuditoria auditLogRepository;
    private final RepositorioUsuario userRepository;
    private final MapeadorRegistroAuditoria auditLogMapper;

    public ServicioAuditoriaImpl(RepositorioRegistroAuditoria auditLogRepository, RepositorioUsuario userRepository, MapeadorRegistroAuditoria auditLogMapper) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.auditLogMapper = auditLogMapper;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String username, AccionAuditoria action, String module, String description, String endpoint, String httpMethod, String clientIp, String result) {
        log(username, action, module, description, endpoint, httpMethod, clientIp, result, null, null, null);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String username, AccionAuditoria action, String module, String description, String endpoint, String httpMethod, String clientIp, String result, String userAgent, String entityName, Long entityId) {
        try {
            Usuario user = null;
            if (username != null && !username.isBlank()) {
                Optional<Usuario> userOpt = userRepository.findByUsername(username);
                if (userOpt.isPresent()) {
                    user = userOpt.get();
                }
            }

            RegistroAuditoria audit = new RegistroAuditoria();
            audit.setUser(user);
            audit.setUsername(username != null ? username : "ANONIMO");
            audit.setAction(action);
            audit.setModule(module);
            audit.setDescription(description);
            audit.setEndpoint(endpoint != null ? endpoint : "/");
            audit.setHttpMethod(httpMethod != null ? httpMethod : "GET");
            audit.setClientIp(clientIp != null ? clientIp : "127.0.0.1");
            audit.setEntityName(entityName);
            audit.setEntityId(entityId);
            audit.setUserAgent(userAgent);
            audit.setResult(result != null ? result : "SUCCESS");
            audit.setTimestamp(LocalDateTime.now());

            auditLogRepository.save(audit);
            log.info("Auditoría registrada: {} [{}] en {} por {}", action, result, endpoint, username);
        } catch (Exception e) {
            log.error("Fallo al persistir registro de auditoría: {}", e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoRegistroAuditoria> getRecentLogs() {
        return auditLogRepository.findTop100ByOrderByTimestampDesc()
                .stream()
                .map(auditLogMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DtoResumenAuditoria getSummary(int dias) {
        int ventana = Math.max(1, Math.min(MAXIMO_DIAS, dias));
        ZoneId zonaServidor = ZoneId.systemDefault();
        LocalDate hoy = LocalDate.now(ZONA_INSTITUCIONAL);
        LocalDate primerDia = hoy.minusDays(ventana - 1L);

        LocalDateTime desde = inicioDelDia(primerDia, zonaServidor);
        LocalDateTime hasta = inicioDelDia(hoy.plusDays(1), zonaServidor);

        List<LocalDateTime> marcas = auditLogRepository.findTimestampsBetween(desde, hasta);
        Map<LocalDate, Long> conteoPorDia = new TreeMap<>();
        for (LocalDate dia = primerDia; !dia.isAfter(hoy); dia = dia.plusDays(1)) {
            conteoPorDia.put(dia, 0L);
        }
        for (LocalDateTime marca : marcas) {
            LocalDate dia = marca.atZone(zonaServidor)
                    .withZoneSameInstant(ZONA_INSTITUCIONAL)
                    .toLocalDate();
            if (conteoPorDia.containsKey(dia)) {
                conteoPorDia.merge(dia, 1L, Long::sum);
            }
        }

        List<DtoConteoAuditoria> porDia = conteoPorDia.entrySet().stream()
                .map(entry -> new DtoConteoAuditoria(
                        entry.getKey().toString(),
                        etiquetaDia(entry.getKey()),
                        entry.getValue()))
                .collect(Collectors.toList());

        long total = marcas.size();
        long exitos = auditLogRepository.countByResultBetween("SUCCESS", desde, hasta);
        long fallos = Math.max(0L, total - exitos);

        Map.Entry<LocalDate, Long> pico = conteoPorDia.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .orElse(null);

        long totalAnterior = auditLogRepository.countBetween(
                inicioDelDia(primerDia.minusDays(ventana), zonaServidor),
                desde);

        double promedio = ventana == 0 ? 0d : redondear(total / (double) ventana, 2);
        Double variacion = totalAnterior == 0
                ? null
                : redondear((total - totalAnterior) * 100d / totalAnterior, 1);

        DtoResumenAuditoria resumen = new DtoResumenAuditoria();
        resumen.setDias(ventana);
        resumen.setDesde(primerDia.toString());
        resumen.setHasta(hoy.toString());
        resumen.setTotal(total);
        resumen.setExitos(exitos);
        resumen.setFallos(fallos);
        resumen.setPromedioDiario(promedio);
        resumen.setTotalPeriodoAnterior(totalAnterior);
        resumen.setVariacionPorcentual(variacion);
        resumen.setPorDia(porDia);
        resumen.setPorAccion(mapearAcciones(auditLogRepository.countByActionBetween(desde, hasta)));
        resumen.setGeneradoEn(Instant.now());

        if (pico != null && pico.getValue() > 0) {
            resumen.setDiaMasActivo(etiquetaDia(pico.getKey()));
            resumen.setDiaMasActivoFecha(pico.getKey().toString());
            resumen.setEventosDiaMasActivo(pico.getValue());
        }

        return resumen;
    }

    private static LocalDateTime inicioDelDia(LocalDate dia, ZoneId zonaServidor) {
        return dia.atStartOfDay(ZONA_INSTITUCIONAL)
                .withZoneSameInstant(zonaServidor)
                .toLocalDateTime();
    }

    /** Etiqueta corta del día sin punto final (`28 oct`). */
    private static String etiquetaDia(LocalDate dia) {
        return dia.format(ETIQUETA_DIA).replace(".", "");
    }

    private static List<DtoConteoAuditoria> mapearAcciones(List<ProyeccionConteoAccion> conteos) {
        return conteos.stream()
                .map(conteo -> new DtoConteoAuditoria(
                        conteo.getAccion() != null ? conteo.getAccion().name() : "DESCONOCIDA",
                        conteo.getAccion() != null ? conteo.getAccion().name() : "DESCONOCIDA",
                        conteo.getTotal()))
                .collect(Collectors.toList());
    }

    private static double redondear(double valor, int decimales) {
        double factor = Math.pow(10, decimales);
        return Math.round(valor * factor) / factor;
    }
}
