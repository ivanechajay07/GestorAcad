package com.gestoracad.service.impl;

import com.gestoracad.dto.DtoNotificacion;
import com.gestoracad.entity.ParametroSistema;
import com.gestoracad.entity.Universidad;
import com.gestoracad.repository.RepositorioDocente;
import com.gestoracad.repository.RepositorioEstudiante;
import com.gestoracad.repository.RepositorioParametroSistema;
import com.gestoracad.repository.RepositorioRegistroAuditoria;
import com.gestoracad.repository.RepositorioUniversidad;
import com.gestoracad.repository.RepositorioUsuario;
import com.gestoracad.security.EvaluadorPermisos;
import com.gestoracad.service.ServicioNotificaciones;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Implementación de los avisos agregados del encabezado.
 * <p>
 * Los avisos se derivan de conteos y estados institucionales. Nunca se envían
 * nombres, documentos, correos ni identificadores de personas. Cada bloque se
 * consulta solo cuando el usuario posee el permiso correspondiente, de modo que
 * el panel no revela información de módulos restringidos.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioNotificacionesImpl implements ServicioNotificaciones {

    static final String PARAMETRO_PERIODO = "PERIODO_ACADEMICO_ACTUAL";
    static final int DIAS_ACTIVIDAD_AUDITORIA = 7;

    static final String TIPO_ADVERTENCIA = "advertencia";
    static final String TIPO_INFO = "info";
    static final String TIPO_EXITO = "exito";

    private static final String PERMISO_ESTUDIANTE = "ESTUDIANTE_VIEW";
    private static final String PERMISO_DOCENTE = "DOCENTE_VIEW";
    private static final String PERMISO_USUARIO = "USUARIO_VIEW";
    private static final String PERMISO_AUDITORIA = "AUDITORIA_VIEW";
    private static final String PERMISO_UNIVERSIDAD = "UNIVERSIDAD_VIEW";

    private static final String ENLACE_ESTUDIANTES = "/students";
    private static final String ENLACE_DOCENTES = "/teachers";
    private static final String ENLACE_USUARIOS = "/users";
    private static final String ENLACE_AUDITORIA = "/audit";
    private static final String ENLACE_UNIVERSIDAD = "/university";

    /** Prioridad visual: primero las advertencias, luego información y logros. */
    private static final Map<String, Integer> ORDEN_TIPO = Map.of(
            TIPO_ADVERTENCIA, 0,
            TIPO_INFO, 1,
            TIPO_EXITO, 2);

    private final RepositorioEstudiante studentRepository;
    private final RepositorioDocente teacherRepository;
    private final RepositorioUsuario userRepository;
    private final RepositorioRegistroAuditoria auditRepository;
    private final RepositorioUniversidad universityRepository;
    private final RepositorioParametroSistema parameterRepository;
    private final EvaluadorPermisos permissionEvaluator;

    public ServicioNotificacionesImpl(RepositorioEstudiante studentRepository,
                                      RepositorioDocente teacherRepository,
                                      RepositorioUsuario userRepository,
                                      RepositorioRegistroAuditoria auditRepository,
                                      RepositorioUniversidad universityRepository,
                                      RepositorioParametroSistema parameterRepository,
                                      EvaluadorPermisos permissionEvaluator) {
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.userRepository = userRepository;
        this.auditRepository = auditRepository;
        this.universityRepository = universityRepository;
        this.parameterRepository = parameterRepository;
        this.permissionEvaluator = permissionEvaluator;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoNotificacion> getNotificaciones() {
        Instant now = Instant.now();
        List<DtoNotificacion> notifications = new ArrayList<>();

        addInactiveStudents(notifications, now);
        addInactiveTeachers(notifications, now);
        addInactiveUsers(notifications, now);
        addAcademicPeriod(notifications, now);
        addRecentAuditActivity(notifications, now);
        addLicensingStatus(notifications, now);

        notifications.sort(Comparator.comparingInt(
                (DtoNotificacion notification) -> ORDEN_TIPO.getOrDefault(
                        notification.getTipo(), ORDEN_TIPO.get(TIPO_INFO))));
        return notifications;
    }

    private void addInactiveStudents(List<DtoNotificacion> notifications, Instant now) {
        if (!permissionEvaluator.tiene(PERMISO_ESTUDIANTE)) {
            return;
        }
        long inactive = inactiveCount(studentRepository.count(), studentRepository.countByActiveTrue());
        if (inactive > 0) {
            notifications.add(new DtoNotificacion(
                    "estudiantes-inactivos-" + inactive,
                    TIPO_ADVERTENCIA,
                    countLabel(inactive, "estudiante inactivo", "estudiantes inactivos"),
                    "Revisa el padrón para confirmar la situación académica de estos registros.",
                    ENLACE_ESTUDIANTES,
                    now));
        }
    }

    private void addInactiveTeachers(List<DtoNotificacion> notifications, Instant now) {
        if (!permissionEvaluator.tiene(PERMISO_DOCENTE)) {
            return;
        }
        long inactive = inactiveCount(teacherRepository.count(), teacherRepository.countByActiveTrue());
        if (inactive > 0) {
            notifications.add(new DtoNotificacion(
                    "docentes-inactivos-" + inactive,
                    TIPO_ADVERTENCIA,
                    countLabel(inactive, "docente inactivo", "docentes inactivos"),
                    "Revisa el claustro para confirmar la vigencia de estas asignaciones.",
                    ENLACE_DOCENTES,
                    now));
        }
    }

    private void addInactiveUsers(List<DtoNotificacion> notifications, Instant now) {
        if (!permissionEvaluator.tiene(PERMISO_USUARIO)) {
            return;
        }
        long inactive = inactiveCount(userRepository.count(), userRepository.countByActiveTrue());
        if (inactive > 0) {
            notifications.add(new DtoNotificacion(
                    "usuarios-inactivos-" + inactive,
                    TIPO_ADVERTENCIA,
                    countLabel(inactive, "cuenta inactiva", "cuentas inactivas"),
                    "Revisa las cuentas deshabilitadas y su vigencia en el sistema.",
                    ENLACE_USUARIOS,
                    now));
        }
    }

    private void addAcademicPeriod(List<DtoNotificacion> notifications, Instant now) {
        parameterRepository.findByKey(PARAMETRO_PERIODO)
                .map(ParametroSistema::getValue)
                .map(String::trim)
                .filter(period -> !period.isEmpty())
                .ifPresent(period -> notifications.add(new DtoNotificacion(
                        "periodo-" + slug(period),
                        TIPO_INFO,
                        "Periodo " + period + " activo",
                        "El periodo académico vigente se encuentra configurado en el sistema.",
                        permissionEvaluator.tiene(PERMISO_UNIVERSIDAD) ? ENLACE_UNIVERSIDAD : null,
                        now)));
    }

    private void addRecentAuditActivity(List<DtoNotificacion> notifications, Instant now) {
        if (!permissionEvaluator.tiene(PERMISO_AUDITORIA)) {
            return;
        }
        long events = auditRepository.countByTimestampAfter(
                LocalDateTime.now().minusDays(DIAS_ACTIVIDAD_AUDITORIA));
        if (events > 0) {
            notifications.add(new DtoNotificacion(
                    "auditoria-" + LocalDate.now(),
                    TIPO_INFO,
                    countLabel(events, "evento auditado", "eventos auditados") + " esta semana",
                    "Actividad registrada en la bitácora durante los últimos "
                            + DIAS_ACTIVIDAD_AUDITORIA + " días.",
                    ENLACE_AUDITORIA,
                    now));
        }
    }

    private void addLicensingStatus(List<DtoNotificacion> notifications, Instant now) {
        universityRepository.findFirstByActiveTrueOrderByIdAsc()
                .map(Universidad::getLicensingStatus)
                .map(String::trim)
                .filter(status -> !status.isEmpty())
                .ifPresent(status -> {
                    boolean licensed = status.toUpperCase(Locale.ROOT).contains("LICENCIAD");
                    notifications.add(new DtoNotificacion(
                            "licenciamiento-" + slug(status),
                            licensed ? TIPO_EXITO : TIPO_ADVERTENCIA,
                            "Licenciamiento " + status,
                            licensed
                                    ? "La institución cuenta con licenciamiento vigente."
                                    : "Revisa el estado de licenciamiento institucional.",
                            permissionEvaluator.tiene(PERMISO_UNIVERSIDAD) ? ENLACE_UNIVERSIDAD : null,
                            now));
                });
    }

    private static long inactiveCount(long total, long active) {
        return Math.max(0, total - active);
    }

    private static String countLabel(long total, String singular, String plural) {
        return total + " " + (total == 1 ? singular : plural);
    }

    private static String slug(String value) {
        return value.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
    }
}
