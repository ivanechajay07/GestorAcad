package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoSede;
import com.gestoracad.entity.Sede;
import com.gestoracad.entity.Universidad;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.mapper.MapeadorSede;
import com.gestoracad.repository.RepositorioSede;
import com.gestoracad.repository.RepositorioUniversidad;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioSede;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementación del servicio de gestión de sedes (campus).
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioSedeImpl implements ServicioSede {

    private static final String MODULE = "SEDE";
    private static final String BASE_ENDPOINT = "/api/v1/campuses";

    private final RepositorioSede campusRepository;
    private final RepositorioUniversidad universityRepository;
    private final MapeadorSede campusMapper;
    private final ServicioAuditoria auditService;

    public ServicioSedeImpl(RepositorioSede campusRepository, RepositorioUniversidad universityRepository, MapeadorSede campusMapper, ServicioAuditoria auditService) {
        this.campusRepository = campusRepository;
        this.universityRepository = universityRepository;
        this.campusMapper = campusMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoSede> getAllCampuses() {
        return campusRepository.findAllByOrderByNameAsc()
                .stream()
                .map(campusMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoSede> getCampusesByUniversity(Long universityId) {
        return campusRepository.findByUniversityIdOrderByNameAsc(universityId)
                .stream()
                .map(campusMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DtoSede getCampusById(Long id) {
        return campusRepository.findById(id)
                .map(campusMapper::toDto)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Sede", "id", id));
    }

    @Override
    @Transactional
    public DtoSede createCampus(DtoSede dto, String clientIp, String userAgent) {
        if (campusRepository.existsByCode(dto.getCode())) {
            auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                    "Intento fallido de registrar sede con código duplicado: " + dto.getCode(),
                    BASE_ENDPOINT, "POST", clientIp, "FAILURE", userAgent, "tb_sedes", null);
            throw new ExcepcionApi("El código de sede '" + dto.getCode() + "' ya se encuentra registrado");
        }

        Universidad university = resolveUniversity(dto.getUniversityId());
        Sede entity = new Sede();
        campusMapper.updateEntity(entity, dto);
        entity.setUniversity(university);
        entity.setCode(dto.getCode().toUpperCase().trim());
        entity.setActive(true);

        Sede saved = campusRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                "Sede registrada exitosamente: " + saved.getName() + " (" + saved.getCode() + ")",
                BASE_ENDPOINT, "POST", clientIp, "SUCCESS", userAgent, "tb_sedes", saved.getId());

        return campusMapper.toDto(saved);
    }

    @Override
    @Transactional
    public DtoSede updateCampus(Long id, DtoSede dto, String clientIp, String userAgent) {
        Sede entity = campusRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Sede", "id", id));

        String newCode = dto.getCode().toUpperCase().trim();
        if (!newCode.equals(entity.getCode()) && campusRepository.existsByCode(newCode)) {
            auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                    "Intento fallido de actualizar sede con código duplicado: " + newCode,
                    BASE_ENDPOINT + "/" + id, "PUT", clientIp, "FAILURE", userAgent, "tb_sedes", id);
            throw new ExcepcionApi("El código de sede '" + newCode + "' ya se encuentra registrado");
        }

        if (dto.getUniversityId() != null) {
            entity.setUniversity(resolveUniversity(dto.getUniversityId()));
        }

        campusMapper.updateEntity(entity, dto);
        entity.setCode(newCode);

        Sede saved = campusRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                "Sede actualizada: " + saved.getName() + " (" + saved.getCode() + ")",
                BASE_ENDPOINT + "/" + id, "PUT", clientIp, "SUCCESS", userAgent, "tb_sedes", saved.getId());

        return campusMapper.toDto(saved);
    }

    @Override
    @Transactional
    public void deleteCampus(Long id, String clientIp, String userAgent) {
        Sede entity = campusRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Sede", "id", id));

        entity.setActive(false);
        entity.setDeletedAt(java.time.LocalDateTime.now());
        campusRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, MODULE,
                "Sede desactivada: " + entity.getName() + " (" + entity.getCode() + ")",
                BASE_ENDPOINT + "/" + id, "DELETE", clientIp, "SUCCESS", userAgent, "tb_sedes", id);
    }

    private Universidad resolveUniversity(Long universityId) {
        if (universityId != null) {
            return universityRepository.findById(universityId)
                    .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Universidad", "id", universityId));
        }
        return universityRepository.findFirstByActiveTrueOrderByIdAsc()
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("No existe una institución universitaria activa configurada"));
    }
}
