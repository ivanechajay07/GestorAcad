package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoPeriodoAcademico;
import com.gestoracad.entity.ParametroSistema;
import com.gestoracad.entity.PeriodoAcademico;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.mapper.MapeadorPeriodoAcademico;
import com.gestoracad.repository.RepositorioParametroSistema;
import com.gestoracad.repository.RepositorioPeriodoAcademico;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioPeriodoAcademico;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementación del servicio de periodos académicos.
 * Garantiza un único periodo vigente y sincroniza el parámetro global
 * {@code PERIODO_ACADEMICO_ACTUAL} que consume el Panel Institucional.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioPeriodoAcademicoImpl implements ServicioPeriodoAcademico {

    private static final String MODULE = "PERIODO";
    private static final String BASE_ENDPOINT = "/api/v1/academic-periods";
    private static final String ENTITY = "tb_periodos_academicos";
    private static final String PARAM_PERIODO = "PERIODO_ACADEMICO_ACTUAL";

    private final RepositorioPeriodoAcademico periodRepository;
    private final RepositorioParametroSistema parameterRepository;
    private final MapeadorPeriodoAcademico periodMapper;
    private final ServicioAuditoria auditService;

    public ServicioPeriodoAcademicoImpl(RepositorioPeriodoAcademico periodRepository,
                                        RepositorioParametroSistema parameterRepository,
                                        MapeadorPeriodoAcademico periodMapper,
                                        ServicioAuditoria auditService) {
        this.periodRepository = periodRepository;
        this.parameterRepository = parameterRepository;
        this.periodMapper = periodMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoPeriodoAcademico> getAllPeriods() {
        return periodRepository.findAllByOrderByStartDateDesc()
                .stream()
                .map(periodMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DtoPeriodoAcademico getPeriodById(Long id) {
        return periodRepository.findById(id)
                .map(periodMapper::toDto)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Periodo académico", "id", id));
    }

    @Override
    @Transactional
    public DtoPeriodoAcademico createPeriod(DtoPeriodoAcademico dto, String clientIp, String userAgent) {
        validateDates(dto);
        String code = normalizeCode(dto.getCode());
        if (periodRepository.existsByCodeIgnoreCase(code)) {
            registerFailure(AccionAuditoria.CREATE,
                    "Intento fallido de registrar periodo con código duplicado: " + code,
                    BASE_ENDPOINT, "POST", clientIp, userAgent, null);
            throw new ExcepcionApi("El periodo '" + code + "' ya se encuentra registrado");
        }

        PeriodoAcademico entity = new PeriodoAcademico();
        periodMapper.updateEntity(entity, dto);
        entity.setCode(code);
        entity.setActive(true);

        // El primer periodo activo se convierte automáticamente en el vigente.
        boolean hasCurrent = periodRepository.findFirstByCurrentTrueAndActiveTrue().isPresent();
        entity.setCurrent(!hasCurrent);

        PeriodoAcademico saved = periodRepository.save(entity);
        if (saved.isCurrent()) {
            syncCurrentPeriodParameter(saved.getCode());
        }

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                "Periodo registrado: " + saved.getCode() + " (" + saved.getName() + ")",
                BASE_ENDPOINT, "POST", clientIp, "SUCCESS", userAgent, ENTITY, saved.getId());

        return periodMapper.toDto(saved);
    }

    @Override
    @Transactional
    public DtoPeriodoAcademico updatePeriod(Long id, DtoPeriodoAcademico dto, String clientIp, String userAgent) {
        validateDates(dto);
        PeriodoAcademico entity = periodRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Periodo académico", "id", id));

        String code = normalizeCode(dto.getCode());
        if (!code.equalsIgnoreCase(entity.getCode()) && periodRepository.existsByCodeIgnoreCase(code)) {
            registerFailure(AccionAuditoria.UPDATE,
                    "Intento fallido de actualizar periodo con código duplicado: " + code,
                    BASE_ENDPOINT + "/" + id, "PUT", clientIp, userAgent, id);
            throw new ExcepcionApi("El periodo '" + code + "' ya se encuentra registrado");
        }

        periodMapper.updateEntity(entity, dto);
        entity.setCode(code);

        PeriodoAcademico saved = periodRepository.save(entity);
        if (saved.isCurrent()) {
            syncCurrentPeriodParameter(saved.getCode());
        }

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                "Periodo actualizado: " + saved.getCode() + " (" + saved.getName() + ")",
                BASE_ENDPOINT + "/" + id, "PUT", clientIp, "SUCCESS", userAgent, ENTITY, saved.getId());

        return periodMapper.toDto(saved);
    }

    @Override
    @Transactional
    public DtoPeriodoAcademico activatePeriod(Long id, String clientIp, String userAgent) {
        PeriodoAcademico entity = periodRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Periodo académico", "id", id));
        if (!entity.isActive()) {
            throw new ExcepcionApi("No se puede activar un periodo desactivado");
        }

        periodRepository.clearCurrent();
        entity.setCurrent(true);
        PeriodoAcademico saved = periodRepository.save(entity);
        syncCurrentPeriodParameter(saved.getCode());

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                "Periodo vigente actualizado a: " + saved.getCode(),
                BASE_ENDPOINT + "/" + id + "/activate", "PATCH", clientIp, "SUCCESS", userAgent, ENTITY, saved.getId());

        return periodMapper.toDto(saved);
    }

    @Override
    @Transactional
    public void deletePeriod(Long id, String clientIp, String userAgent) {
        PeriodoAcademico entity = periodRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Periodo académico", "id", id));
        if (entity.isCurrent()) {
            registerFailure(AccionAuditoria.DELETE,
                    "Intento fallido de desactivar el periodo vigente: " + entity.getCode(),
                    BASE_ENDPOINT + "/" + id, "DELETE", clientIp, userAgent, id);
            throw new ExcepcionApi("No se puede desactivar el periodo vigente. Activa otro periodo primero.");
        }

        entity.setActive(false);
        entity.setDeletedAt(java.time.LocalDateTime.now());
        periodRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, MODULE,
                "Periodo desactivado: " + entity.getCode(),
                BASE_ENDPOINT + "/" + id, "DELETE", clientIp, "SUCCESS", userAgent, ENTITY, id);
    }

    private void validateDates(DtoPeriodoAcademico dto) {
        if (dto.getStartDate() != null && dto.getEndDate() != null
                && dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new ExcepcionApi("La fecha de fin no puede ser anterior a la fecha de inicio");
        }
        if (dto.getEnrollmentStart() != null && dto.getEnrollmentEnd() != null
                && dto.getEnrollmentEnd().isBefore(dto.getEnrollmentStart())) {
            throw new ExcepcionApi("El fin de matrícula no puede ser anterior al inicio de matrícula");
        }
    }

    private String normalizeCode(String code) {
        return code == null ? "" : code.toUpperCase().trim();
    }

    /**
     * Mantiene alineado el parámetro global que alimenta el Dashboard y las notificaciones.
     */
    private void syncCurrentPeriodParameter(String periodCode) {
        ParametroSistema parameter = parameterRepository.findByKey(PARAM_PERIODO)
                .orElseGet(() -> {
                    ParametroSistema nuevo = new ParametroSistema();
                    nuevo.setKey(PARAM_PERIODO);
                    nuevo.setValueType("STRING");
                    nuevo.setModule("ACADEMICO");
                    nuevo.setDescription("Periodo académico vigente");
                    nuevo.setActive(true);
                    return nuevo;
                });
        parameter.setValue(periodCode);
        parameterRepository.save(parameter);
    }

    private void registerFailure(AccionAuditoria action, String description, String endpoint,
                                 String method, String clientIp, String userAgent, Long entityId) {
        auditService.log(UtilidadesSeguridad.getCurrentUsername(), action, MODULE, description,
                endpoint, method, clientIp, "FAILURE", userAgent, ENTITY, entityId);
    }
}
