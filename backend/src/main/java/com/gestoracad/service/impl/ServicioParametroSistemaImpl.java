package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoParametroSistema;
import com.gestoracad.entity.ParametroSistema;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.mapper.MapeadorParametroSistema;
import com.gestoracad.repository.RepositorioParametroSistema;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioParametroSistema;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Implementación del servicio de gestión de parámetros de configuración del sistema.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioParametroSistemaImpl implements ServicioParametroSistema {

    private static final String MODULE = "PARAMETRO";
    private static final String BASE_ENDPOINT = "/api/v1/parameters";
    private static final Set<String> TIPOS_VALIDOS = Set.of("STRING", "NUMBER", "BOOLEAN", "DATE");
    private static final Set<String> CLAVES_PROTEGIDAS = Set.of(
            "PERIODO_ACADEMICO_ACTUAL",
            "NOTA_MINIMA_APROBATORIA",
            "MAX_CREDITOS_POR_PERIODO");

    private final RepositorioParametroSistema parameterRepository;
    private final MapeadorParametroSistema parameterMapper;
    private final ServicioAuditoria auditService;

    public ServicioParametroSistemaImpl(RepositorioParametroSistema parameterRepository, MapeadorParametroSistema parameterMapper, ServicioAuditoria auditService) {
        this.parameterRepository = parameterRepository;
        this.parameterMapper = parameterMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoParametroSistema> getAllParameters() {
        return parameterRepository.findAllByOrderByModuleAscKeyAsc()
                .stream()
                .map(parameterMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DtoParametroSistema getParameterByKey(String key) {
        return parameterRepository.findByKey(key)
                .map(parameterMapper::toDto)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Parámetro", "clave", key));
    }

    @Override
    @Transactional
    public DtoParametroSistema createParameter(DtoParametroSistema dto, String clientIp, String userAgent) {
        validateParameter(dto);
        String key = dto.getKey().toUpperCase().trim();
        if (parameterRepository.existsByKey(key)) {
            auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                    "Intento fallido de registrar parámetro con clave duplicada: " + key,
                    BASE_ENDPOINT, "POST", clientIp, "FAILURE", userAgent, "tb_parametros", null);
            throw new ExcepcionApi("La clave de parámetro '" + key + "' ya se encuentra registrada");
        }

        ParametroSistema entity = new ParametroSistema();
        parameterMapper.updateEntity(entity, dto);
        entity.setKey(key);
        entity.setActive(true);

        ParametroSistema saved = parameterRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                "Parámetro registrado: " + saved.getKey() + " = " + saved.getValue(),
                BASE_ENDPOINT, "POST", clientIp, "SUCCESS", userAgent, "tb_parametros", saved.getId());

        return parameterMapper.toDto(saved);
    }

    @Override
    @Transactional
    public DtoParametroSistema updateParameter(Long id, DtoParametroSistema dto, String clientIp, String userAgent) {
        validateParameter(dto);
        ParametroSistema entity = parameterRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Parámetro", "id", id));

        String newKey = dto.getKey().toUpperCase().trim();
        if (CLAVES_PROTEGIDAS.contains(entity.getKey()) && !newKey.equals(entity.getKey())) {
            auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                    "Intento fallido de renombrar un parámetro protegido: " + entity.getKey(),
                    BASE_ENDPOINT + "/" + id, "PUT", clientIp, "FAILURE", userAgent, "tb_parametros", id);
            throw new ExcepcionApi("La clave '" + entity.getKey() + "' es obligatoria y no puede renombrarse");
        }
        if (!newKey.equals(entity.getKey()) && parameterRepository.existsByKey(newKey)) {
            auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                    "Intento fallido de actualizar parámetro con clave duplicada: " + newKey,
                    BASE_ENDPOINT + "/" + id, "PUT", clientIp, "FAILURE", userAgent, "tb_parametros", id);
            throw new ExcepcionApi("La clave de parámetro '" + newKey + "' ya se encuentra registrada");
        }

        parameterMapper.updateEntity(entity, dto);
        entity.setKey(newKey);

        ParametroSistema saved = parameterRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                "Parámetro actualizado: " + saved.getKey() + " = " + saved.getValue(),
                BASE_ENDPOINT + "/" + id, "PUT", clientIp, "SUCCESS", userAgent, "tb_parametros", saved.getId());

        return parameterMapper.toDto(saved);
    }

    @Override
    @Transactional
    public void deleteParameter(Long id, String clientIp, String userAgent) {
        ParametroSistema entity = parameterRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Parámetro", "id", id));

        if (CLAVES_PROTEGIDAS.contains(entity.getKey())) {
            auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, MODULE,
                    "Intento fallido de desactivar un parámetro obligatorio: " + entity.getKey(),
                    BASE_ENDPOINT + "/" + id, "DELETE", clientIp, "FAILURE", userAgent, "tb_parametros", id);
            throw new ExcepcionApi("El parámetro '" + entity.getKey() + "' es obligatorio y no puede desactivarse");
        }

        entity.setActive(false);
        entity.setDeletedAt(java.time.LocalDateTime.now());
        parameterRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, MODULE,
                "Parámetro desactivado: " + entity.getKey(),
                BASE_ENDPOINT + "/" + id, "DELETE", clientIp, "SUCCESS", userAgent, "tb_parametros", id);
    }

    /**
     * Valida que el tipo declarado sea soportado y que el valor sea coherente con él.
     * Evita que un NUMBER/BOOLEAN/DATE guarde texto inválido y rompa a sus consumidores.
     */
    private void validateParameter(DtoParametroSistema dto) {
        String type = dto.getValueType() == null ? "" : dto.getValueType().trim().toUpperCase();
        if (!TIPOS_VALIDOS.contains(type)) {
            throw new ExcepcionApi("Tipo de parámetro inválido. Use STRING, NUMBER, BOOLEAN o DATE");
        }
        String value = dto.getValue() == null ? "" : dto.getValue().trim();
        switch (type) {
            case "NUMBER" -> {
                try {
                    new BigDecimal(value);
                } catch (NumberFormatException ex) {
                    throw new ExcepcionApi("El parámetro '" + dto.getKey() + "' requiere un valor numérico");
                }
            }
            case "BOOLEAN" -> {
                if (!"true".equalsIgnoreCase(value) && !"false".equalsIgnoreCase(value)) {
                    throw new ExcepcionApi("El parámetro '" + dto.getKey() + "' requiere true o false");
                }
            }
            case "DATE" -> {
                try {
                    LocalDate.parse(value);
                } catch (DateTimeParseException ex) {
                    throw new ExcepcionApi("El parámetro '" + dto.getKey() + "' requiere una fecha ISO (AAAA-MM-DD)");
                }
            }
            default -> { /* STRING: sin validación adicional */ }
        }
        dto.setValueType(type);
        dto.setValue(value);
    }
}
