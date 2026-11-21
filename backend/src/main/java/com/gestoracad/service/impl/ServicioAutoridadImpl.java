package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoAutoridad;
import com.gestoracad.entity.Autoridad;
import com.gestoracad.entity.Universidad;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.mapper.MapeadorAutoridad;
import com.gestoracad.repository.RepositorioAutoridad;
import com.gestoracad.repository.RepositorioUniversidad;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioAutoridad;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementación del servicio de gestión de autoridades institucionales.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioAutoridadImpl implements ServicioAutoridad {

    private static final String MODULE = "AUTORIDAD";
    private static final String BASE_ENDPOINT = "/api/v1/authorities";

    private final RepositorioAutoridad authorityRepository;
    private final RepositorioUniversidad universityRepository;
    private final MapeadorAutoridad authorityMapper;
    private final ServicioAuditoria auditService;

    public ServicioAutoridadImpl(RepositorioAutoridad authorityRepository, RepositorioUniversidad universityRepository, MapeadorAutoridad authorityMapper, ServicioAuditoria auditService) {
        this.authorityRepository = authorityRepository;
        this.universityRepository = universityRepository;
        this.authorityMapper = authorityMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoAutoridad> getAllAuthorities() {
        return authorityRepository.findAllByOrderByPositionAsc()
                .stream()
                .map(authorityMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoAutoridad> getAuthoritiesByUniversity(Long universityId) {
        return authorityRepository.findByUniversityIdOrderByPositionAsc(universityId)
                .stream()
                .map(authorityMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DtoAutoridad getAuthorityById(Long id) {
        return authorityRepository.findById(id)
                .map(authorityMapper::toDto)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Autoridad", "id", id));
    }

    @Override
    @Transactional
    public DtoAutoridad createAuthority(DtoAutoridad dto, String clientIp, String userAgent) {
        Universidad university = resolveUniversity(dto.getUniversityId());
        Autoridad entity = new Autoridad();
        authorityMapper.updateEntity(entity, dto);
        entity.setUniversity(university);
        entity.setActive(true);

        Autoridad saved = authorityRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                "Autoridad registrada: " + saved.getFirstName() + " " + saved.getLastName() + " (" + saved.getPosition() + ")",
                BASE_ENDPOINT, "POST", clientIp, "SUCCESS", userAgent, "tb_autoridades", saved.getId());

        return authorityMapper.toDto(saved);
    }

    @Override
    @Transactional
    public DtoAutoridad updateAuthority(Long id, DtoAutoridad dto, String clientIp, String userAgent) {
        Autoridad entity = authorityRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Autoridad", "id", id));

        if (dto.getUniversityId() != null) {
            entity.setUniversity(resolveUniversity(dto.getUniversityId()));
        }

        authorityMapper.updateEntity(entity, dto);
        Autoridad saved = authorityRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, MODULE,
                "Autoridad actualizada: " + saved.getFirstName() + " " + saved.getLastName() + " (" + saved.getPosition() + ")",
                BASE_ENDPOINT + "/" + id, "PUT", clientIp, "SUCCESS", userAgent, "tb_autoridades", saved.getId());

        return authorityMapper.toDto(saved);
    }

    @Override
    @Transactional
    public void deleteAuthority(Long id, String clientIp, String userAgent) {
        Autoridad entity = authorityRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Autoridad", "id", id));

        entity.setActive(false);
        entity.setDeletedAt(java.time.LocalDateTime.now());
        authorityRepository.save(entity);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, MODULE,
                "Autoridad desactivada: " + entity.getFirstName() + " " + entity.getLastName() + " (" + entity.getPosition() + ")",
                BASE_ENDPOINT + "/" + id, "DELETE", clientIp, "SUCCESS", userAgent, "tb_autoridades", id);
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
