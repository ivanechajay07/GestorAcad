package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoHorarioSeccion;
import com.gestoracad.entity.HorarioSeccion;
import com.gestoracad.entity.Seccion;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.mapper.MapeadorHorarioSeccion;
import com.gestoracad.repository.RepositorioHorarioSeccion;
import com.gestoracad.repository.RepositorioSeccion;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioHorarioSeccion;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

/**
 * Implementación de horarios estructurados con detección de choques por
 * sección, docente y aula.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioHorarioSeccionImpl implements ServicioHorarioSeccion {

    private static final String MODULE = "SECCION";
    private static final String ENTITY = "tb_seccion_horarios";

    private final RepositorioHorarioSeccion scheduleRepository;
    private final RepositorioSeccion sectionRepository;
    private final MapeadorHorarioSeccion scheduleMapper;
    private final ServicioAuditoria auditService;

    public ServicioHorarioSeccionImpl(RepositorioHorarioSeccion scheduleRepository,
                                      RepositorioSeccion sectionRepository,
                                      MapeadorHorarioSeccion scheduleMapper,
                                      ServicioAuditoria auditService) {
        this.scheduleRepository = scheduleRepository;
        this.sectionRepository = sectionRepository;
        this.scheduleMapper = scheduleMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoHorarioSeccion> getSchedules(Long sectionId) {
        ensureSection(sectionId);
        return scheduleRepository.findBySectionIdAndActiveTrueOrderByDayAscStartTimeAsc(sectionId)
                .stream()
                .map(scheduleMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DtoHorarioSeccion addSchedule(Long sectionId, DtoHorarioSeccion dto, String clientIp, String userAgent) {
        Seccion section = ensureSection(sectionId);
        if (!section.isActive()) {
            throw new ExcepcionApi("No se puede agregar horario a una sección desactivada");
        }
        if (dto.getStartTime() == null || dto.getEndTime() == null
                || !dto.getEndTime().isAfter(dto.getStartTime())) {
            throw new ExcepcionApi("La hora de fin debe ser posterior a la hora de inicio");
        }
        String day = dto.getDay().toUpperCase(Locale.ROOT).trim();
        LocalTime start = dto.getStartTime();
        LocalTime end = dto.getEndTime();

        boolean duplicate = scheduleRepository
                .findBySectionIdAndActiveTrueOrderByDayAscStartTimeAsc(sectionId)
                .stream()
                .anyMatch(h -> h.getDay().equalsIgnoreCase(day) && h.getStartTime().equals(start));
        if (duplicate) {
            throw new ExcepcionApi("La sección ya tiene un bloque que inicia a esa hora el " + day);
        }

        List<HorarioSeccion> overlaps = scheduleRepository.findOverlapping(
                section.getPeriod().getId(), day, start, end);
        for (HorarioSeccion other : overlaps) {
            if (other.getSection().getId().equals(sectionId)) {
                throw new ExcepcionApi("La sección ya tiene un bloque que se cruza el " + day
                        + " entre " + format(start) + " y " + format(end));
            }
            if (section.getTeacher() != null && other.getSection().getTeacher() != null
                    && section.getTeacher().getId().equals(other.getSection().getTeacher().getId())) {
                throw new ExcepcionApi("El docente ya tiene una sección en ese horario ("
                        + other.getSection().getCourse().getCode() + "-" + other.getSection().getCode() + ")");
            }
            if (sameClassroom(dto.getClassroom(), other.getClassroom())) {
                throw new ExcepcionApi("El aula '" + dto.getClassroom().trim()
                        + "' está ocupada en ese horario por "
                        + other.getSection().getCourse().getCode() + "-" + other.getSection().getCode());
            }
        }

        HorarioSeccion entity = new HorarioSeccion();
        entity.setSection(section);
        entity.setDay(day);
        entity.setStartTime(start);
        entity.setEndTime(end);
        entity.setClassroom(dto.getClassroom() == null ? null : dto.getClassroom().trim());
        entity.setActive(true);
        HorarioSeccion saved = scheduleRepository.save(entity);
        syncSectionText(section);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                "Horario agregado a " + section.getCourse().getCode() + "-" + section.getCode()
                        + ": " + day + " " + format(start) + "-" + format(end),
                "/api/v1/sections/" + sectionId + "/schedules", "POST", clientIp, "SUCCESS", userAgent,
                ENTITY, saved.getId());

        return scheduleMapper.toDto(saved);
    }

    @Override
    @Transactional
    public void removeSchedule(Long sectionId, Long scheduleId, String clientIp, String userAgent) {
        Seccion section = ensureSection(sectionId);
        HorarioSeccion entity = scheduleRepository.findByIdAndSectionId(scheduleId, sectionId)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Horario", "id", scheduleId));
        entity.setActive(false);
        entity.setDeletedAt(java.time.LocalDateTime.now());
        scheduleRepository.save(entity);
        syncSectionText(section);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, MODULE,
                "Horario retirado de " + section.getCourse().getCode() + "-" + section.getCode(),
                "/api/v1/sections/" + sectionId + "/schedules/" + scheduleId, "DELETE", clientIp,
                "SUCCESS", userAgent, ENTITY, scheduleId);
    }

    private void syncSectionText(Seccion section) {
        List<HorarioSeccion> schedules = scheduleRepository
                .findBySectionIdAndActiveTrueOrderByDayAscStartTimeAsc(section.getId());
        String summary = schedules.stream()
                .map(h -> abbreviate(h.getDay()) + " " + format(h.getStartTime()) + "-" + format(h.getEndTime()))
                .collect(Collectors.joining(" · "));
        section.setSchedule(summary.isBlank() ? null : summary);
        sectionRepository.save(section);
    }

    private Seccion ensureSection(Long sectionId) {
        return sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Sección", "id", sectionId));
    }

    private boolean sameClassroom(String first, String second) {
        return first != null && second != null
                && !first.isBlank() && !second.isBlank()
                && first.trim().equalsIgnoreCase(second.trim());
    }

    private String format(LocalTime time) {
        return String.format("%02d:%02d", time.getHour(), time.getMinute());
    }

    private String abbreviate(String day) {
        return switch (day) {
            case "LUNES" -> "LUN";
            case "MARTES" -> "MAR";
            case "MIERCOLES" -> "MIÉ";
            case "JUEVES" -> "JUE";
            case "VIERNES" -> "VIE";
            case "SABADO" -> "SÁB";
            case "DOMINGO" -> "DOM";
            default -> day;
        };
    }
}
