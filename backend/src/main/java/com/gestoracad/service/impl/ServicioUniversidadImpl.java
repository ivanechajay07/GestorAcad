package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoUniversidad;
import com.gestoracad.entity.Universidad;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.mapper.MapeadorUniversidad;
import com.gestoracad.repository.RepositorioUniversidad;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioUniversidad;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementación del servicio de gestión de la información institucional de la universidad.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioUniversidadImpl implements ServicioUniversidad {

    private static final String MODULE = "UNIVERSIDAD";
    private static final String BASE_ENDPOINT = "/api/v1/university";

    private final RepositorioUniversidad universityRepository;
    private final MapeadorUniversidad universityMapper;
    private final ServicioAuditoria auditService;

    public ServicioUniversidadImpl(RepositorioUniversidad universityRepository, MapeadorUniversidad universityMapper, ServicioAuditoria auditService) {
        this.universityRepository = universityRepository;
        this.universityMapper = universityMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoUniversidad> getAllUniversities() {
        return universityRepository.findAll()
                .stream()
                .map(universityMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DtoUniversidad getUniversityById(Long id) {
        return universityRepository.findById(id)
                .map(universityMapper::toDto)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Universidad", "id", id));
    }

    @Override
    @Transactional(readOnly = true)
    public DtoUniversidad getActiveUniversity() {
        return universityRepository.findFirstByActiveTrueOrderByIdAsc()
                .map(universityMapper::toDto)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("No existe una institución universitaria activa configurada"));
    }

    @Override
    @Transactional
    public DtoUniversidad createUniversity(DtoUniversidad dto, String clientIp, String userAgent) {
        if (dto.getTaxId() != null && !dto.getTaxId().isBlank() && universityRepository.existsByTaxId(dto.getTaxId())) {
            auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                    "Intento fallido de registrar institución con RUC duplicado: " + dto.getTaxId(),
                    BASE_ENDPOINT, "POST", clientIp, "FAILURE", userAgent, "tb_universidad", null);
            throw new ExcepcionApi("El RUC '" + dto.getTaxId() + "' ya se encuentra registrado en el sistema");
        }

        Universidad entity = new Universidad();
        universityMapper.updateEntity(entity, dto);
        entity.setActive(true);
        Universidad saved = universityRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                "Institución registrada exitosamente: " + saved.getName(),
                BASE_ENDPOINT, "POST", clientIp, "SUCCESS", userAgent, "tb_universidad", saved.getId());

        return universityMapper.toDto(saved);
    }

    @Override
    @Transactional
    public DtoUniversidad updateUniversity(Long id, DtoUniversidad dto, String clientIp, String userAgent) {
        Universidad entity = universityRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Universidad", "id", id));

        if (dto.getTaxId() != null && !dto.getTaxId().isBlank()
                && !dto.getTaxId().equals(entity.getTaxId())
                && universityRepository.existsByTaxId(dto.getTaxId())) {
            auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                    "Intento fallido de actualizar institución con RUC duplicado: " + dto.getTaxId(),
                    BASE_ENDPOINT + "/" + id, "PUT", clientIp, "FAILURE", userAgent, "tb_universidad", id);
            throw new ExcepcionApi("El RUC '" + dto.getTaxId() + "' ya se encuentra registrado en el sistema");
        }

        universityMapper.updateEntity(entity, dto);
        Universidad saved = universityRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                "Información institucional actualizada: " + saved.getName(),
                BASE_ENDPOINT + "/" + id, "PUT", clientIp, "SUCCESS", userAgent, "tb_universidad", saved.getId());

        return universityMapper.toDto(saved);
    }

    @Override
    @Transactional
    public void toggleUniversityStatus(Long id, boolean active, String clientIp, String userAgent) {
        Universidad entity = universityRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Universidad", "id", id));

        entity.setActive(active);
        universityRepository.save(entity);

        String detail = active ? "Institución habilitada" : "Institución deshabilitada";
        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                detail + " (ID: " + id + ")",
                BASE_ENDPOINT + "/" + id + "/status", "PATCH", clientIp, "SUCCESS", userAgent, "tb_universidad", id);
    }
}
