package com.gestoracad.service.impl;

import com.gestoracad.dto.DtoAuditoriaDashboard;
import com.gestoracad.dto.DtoConteoDashboard;
import com.gestoracad.dto.DtoInstitucionDashboard;
import com.gestoracad.dto.DtoMetricaDashboard;
import com.gestoracad.dto.DtoResumenDashboard;
import com.gestoracad.entity.ParametroSistema;
import com.gestoracad.entity.Universidad;
import com.gestoracad.repository.ProyeccionConteoCiclo;
import com.gestoracad.repository.ProyeccionConteoTexto;
import com.gestoracad.repository.RepositorioDocente;
import com.gestoracad.repository.RepositorioEstudiante;
import com.gestoracad.repository.RepositorioParametroSistema;
import com.gestoracad.repository.RepositorioRegistroAuditoria;
import com.gestoracad.repository.RepositorioSede;
import com.gestoracad.repository.RepositorioUniversidad;
import com.gestoracad.repository.RepositorioUsuario;
import com.gestoracad.security.EvaluadorPermisos;
import com.gestoracad.service.ServicioResumenDashboard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Implementación del resumen del panel institucional.
 * <p>
 * Aplica minimización de datos: cada consulta devuelve agregados
 * ({@code COUNT}, {@code GROUP BY}) y no listas de entidades con información
 * personal. La visibilidad de cada bloque depende de los permisos del usuario.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioResumenDashboardImpl implements ServicioResumenDashboard {

    static final String PARAMETRO_PERIODO = "PERIODO_ACADEMICO_ACTUAL";
    static final int DIAS_ACTIVIDAD_AUDITORIA = 7;

    private static final String PERMISO_ESTUDIANTE = "ESTUDIANTE_VIEW";
    private static final String PERMISO_DOCENTE = "DOCENTE_VIEW";
    private static final String PERMISO_USUARIO = "USUARIO_VIEW";
    private static final String PERMISO_AUDITORIA = "AUDITORIA_VIEW";
    private static final String PERMISO_SEDE = "SEDE_VIEW";

    private final RepositorioEstudiante studentRepository;
    private final RepositorioDocente teacherRepository;
    private final RepositorioUsuario userRepository;
    private final RepositorioRegistroAuditoria auditRepository;
    private final RepositorioSede campusRepository;
    private final RepositorioUniversidad universityRepository;
    private final RepositorioParametroSistema parameterRepository;
    private final EvaluadorPermisos permissionEvaluator;

    public ServicioResumenDashboardImpl(RepositorioEstudiante studentRepository,
                                        RepositorioDocente teacherRepository,
                                        RepositorioUsuario userRepository,
                                        RepositorioRegistroAuditoria auditRepository,
                                        RepositorioSede campusRepository,
                                        RepositorioUniversidad universityRepository,
                                        RepositorioParametroSistema parameterRepository,
                                        EvaluadorPermisos permissionEvaluator) {
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.userRepository = userRepository;
        this.auditRepository = auditRepository;
        this.campusRepository = campusRepository;
        this.universityRepository = universityRepository;
        this.parameterRepository = parameterRepository;
        this.permissionEvaluator = permissionEvaluator;
    }

    @Override
    @Transactional(readOnly = true)
    public DtoResumenDashboard getSummary() {
        DtoResumenDashboard summary = new DtoResumenDashboard();
        Optional<Universidad> activeUniversity = universityRepository.findFirstByActiveTrueOrderByIdAsc();

        summary.setInstitucion(buildInstitution(activeUniversity));

        if (permissionEvaluator.tiene(PERMISO_ESTUDIANTE)) {
            summary.setEstudiantes(new DtoMetricaDashboard(
                    studentRepository.count(),
                    studentRepository.countByActiveTrue()));
            summary.setFacultades(studentRepository.countActiveFaculties());
            summary.setCarreras(studentRepository.countActiveCareers());
            summary.setEstudiantesPorCiclo(mapCycles(studentRepository.countActiveByCycle()));
            summary.setEstudiantesPorFacultad(mapTextCounts(studentRepository.countActiveByFaculty()));
            summary.setEstudiantesPorCarrera(mapTextCounts(studentRepository.countActiveByCareer()));
        }

        if (permissionEvaluator.tiene(PERMISO_DOCENTE)) {
            summary.setDocentes(new DtoMetricaDashboard(
                    teacherRepository.count(),
                    teacherRepository.countByActiveTrue()));
            summary.setDocentesPorCategoria(mapTextCounts(teacherRepository.countActiveByCategory()));
            summary.setDocentesPorFacultad(mapTextCounts(teacherRepository.countActiveByFaculty()));
        }

        if (permissionEvaluator.tiene(PERMISO_USUARIO)) {
            summary.setUsuarios(new DtoMetricaDashboard(
                    userRepository.count(),
                    userRepository.countByActiveTrue()));
        }

        if (permissionEvaluator.tiene(PERMISO_AUDITORIA)) {
            summary.setAuditoria(buildAuditSummary());
        }

        summary.setGeneradoEn(LocalDateTime.now());
        return summary;
    }

    private DtoInstitucionDashboard buildInstitution(Optional<Universidad> activeUniversity) {
        DtoInstitucionDashboard institution = new DtoInstitucionDashboard();
        activeUniversity.ifPresent(university -> {
            institution.setNombre(university.getName());
            institution.setNombreCorto(university.getShortName());
            institution.setEstadoLicenciamiento(university.getLicensingStatus());
            if (permissionEvaluator.tiene(PERMISO_SEDE)) {
                institution.setSedesActivas(
                        campusRepository.countByUniversityIdAndActiveTrue(university.getId()));
            }
        });
        parameterRepository.findByKey(PARAMETRO_PERIODO)
                .map(ParametroSistema::getValue)
                .ifPresent(institution::setPeriodo);
        return institution;
    }

    private DtoAuditoriaDashboard buildAuditSummary() {
        DtoAuditoriaDashboard audit = new DtoAuditoriaDashboard();
        audit.setEventosTotales(auditRepository.count());

        LocalDate today = LocalDate.now();
        LocalDate from = today.minusDays(DIAS_ACTIVIDAD_AUDITORIA - 1L);
        Map<LocalDate, Long> eventsByDay = auditRepository.findTimestampsSince(from.atStartOfDay())
                .stream()
                .collect(Collectors.groupingBy(LocalDateTime::toLocalDate, Collectors.counting()));

        List<DtoConteoDashboard> events = new ArrayList<>(DIAS_ACTIVIDAD_AUDITORIA);
        for (LocalDate day = from; !day.isAfter(today); day = day.plusDays(1)) {
            events.add(new DtoConteoDashboard(day.toString(), eventsByDay.getOrDefault(day, 0L)));
        }
        audit.setEventosPorDia(events);
        return audit;
    }

    private List<DtoConteoDashboard> mapCycles(List<ProyeccionConteoCiclo> counts) {
        List<DtoConteoDashboard> result = new ArrayList<>(counts.size());
        for (ProyeccionConteoCiclo count : counts) {
            if (count.getEtiqueta() == null) {
                continue;
            }
            result.add(new DtoConteoDashboard("Ciclo " + count.getEtiqueta(), count.getTotal()));
        }
        return result;
    }

    private List<DtoConteoDashboard> mapTextCounts(List<ProyeccionConteoTexto> counts) {
        List<DtoConteoDashboard> result = new ArrayList<>(counts.size());
        for (ProyeccionConteoTexto count : counts) {
            result.add(new DtoConteoDashboard(count.getEtiqueta(), count.getTotal()));
        }
        return result;
    }
}
