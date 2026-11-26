package com.gestoracad.service;

import com.gestoracad.dto.DtoConteoDashboard;
import com.gestoracad.dto.DtoResumenDashboard;
import com.gestoracad.entity.ParametroSistema;
import com.gestoracad.entity.Universidad;
import com.gestoracad.repository.ProyeccionConteoCiclo;
import com.gestoracad.repository.ProyeccionConteoTexto;
import com.gestoracad.repository.RepositorioDocente;
import com.gestoracad.repository.RepositorioEstudiante;
import com.gestoracad.repository.RepositorioParametroSistema;
import com.gestoracad.repository.RepositorioPeriodoAcademico;
import com.gestoracad.repository.RepositorioRegistroAuditoria;
import com.gestoracad.repository.RepositorioSeccion;
import com.gestoracad.repository.RepositorioMatricula;
import com.gestoracad.repository.RepositorioSede;
import com.gestoracad.repository.RepositorioUniversidad;
import com.gestoracad.repository.RepositorioUsuario;
import com.gestoracad.security.EvaluadorPermisos;
import com.gestoracad.service.impl.ServicioResumenDashboardImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Pruebas unitarias del resumen del panel.
 * Verifican el filtrado por permisos (seguridad), la agregación de métricas y
 * la construcción de la serie de auditoría sin depender de la base de datos.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@ExtendWith(MockitoExtension.class)
class ServicioResumenDashboardTest {

    @Mock
    private RepositorioEstudiante studentRepository;
    @Mock
    private RepositorioDocente teacherRepository;
    @Mock
    private RepositorioUsuario userRepository;
    @Mock
    private RepositorioRegistroAuditoria auditRepository;
    @Mock
    private RepositorioSede campusRepository;
    @Mock
    private RepositorioUniversidad universityRepository;
    @Mock
    private RepositorioParametroSistema parameterRepository;
    @Mock
    private RepositorioPeriodoAcademico periodRepository;
    @Mock
    private RepositorioSeccion sectionRepository;
    @Mock
    private RepositorioMatricula enrollmentRepository;
    @Mock
    private EvaluadorPermisos permissionEvaluator;

    @InjectMocks
    private ServicioResumenDashboardImpl service;

    private static Universidad universidad() {
        Universidad university = new Universidad();
        university.setId(7L);
        university.setName("Universidad Nacional de Innovación & Tecnología");
        university.setShortName("UNINTEP");
        university.setLicensingStatus("LICENCIADA");
        return university;
    }

    private static ParametroSistema periodo(String valor) {
        ParametroSistema parameter = new ParametroSistema();
        parameter.setKey("PERIODO_ACADEMICO_ACTUAL");
        parameter.setValue(valor);
        return parameter;
    }

    private static ProyeccionConteoTexto texto(String etiqueta, long total) {
        return new ProyeccionConteoTexto() {
            @Override
            public String getEtiqueta() {
                return etiqueta;
            }

            @Override
            public long getTotal() {
                return total;
            }
        };
    }

    private static ProyeccionConteoCiclo ciclo(int etiqueta, long total) {
        return new ProyeccionConteoCiclo() {
            @Override
            public Integer getEtiqueta() {
                return etiqueta;
            }

            @Override
            public long getTotal() {
                return total;
            }
        };
    }

    @Test
    @DisplayName("Con todos los permisos devuelve métricas, distribuciones y resumen de auditoría")
    void devuelveTodosLosBloquesConPermisos() {
        when(permissionEvaluator.tiene(anyString())).thenReturn(true);
        when(universityRepository.findFirstByActiveTrueOrderByIdAsc()).thenReturn(Optional.of(universidad()));
        when(parameterRepository.findByKey("PERIODO_ACADEMICO_ACTUAL")).thenReturn(Optional.of(periodo("2026-I")));
        when(campusRepository.countByUniversityIdAndActiveTrue(7L)).thenReturn(3L);

        when(studentRepository.count()).thenReturn(10L);
        when(studentRepository.countByActiveTrue()).thenReturn(8L);
        when(studentRepository.countActiveFaculties()).thenReturn(2L);
        when(studentRepository.countActiveCareers()).thenReturn(3L);
        when(studentRepository.countActiveByCycle()).thenReturn(List.of(ciclo(1, 3), ciclo(2, 5)));
        when(studentRepository.countActiveByFaculty()).thenReturn(List.of(texto("F1", 5), texto("F2", 3)));
        when(studentRepository.countActiveByCareer()).thenReturn(List.of(texto("C1", 4)));

        when(teacherRepository.count()).thenReturn(6L);
        when(teacherRepository.countByActiveTrue()).thenReturn(5L);
        when(teacherRepository.countActiveByCategory()).thenReturn(List.of(texto("PRINCIPAL", 4)));
        when(teacherRepository.countActiveByFaculty()).thenReturn(List.of(texto("F1", 4)));

        when(userRepository.count()).thenReturn(3L);
        when(userRepository.countByActiveTrue()).thenReturn(3L);

        when(auditRepository.count()).thenReturn(42L);
        LocalDateTime now = LocalDateTime.now();
        when(auditRepository.findTimestampsSince(any(LocalDateTime.class)))
                .thenReturn(List.of(now, now.minusDays(1)));

        DtoResumenDashboard summary = service.getSummary();

        assertEquals("2026-I", summary.getInstitucion().getPeriodo());
        assertEquals("UNINTEP", summary.getInstitucion().getNombreCorto());
        assertEquals(3L, summary.getInstitucion().getSedesActivas());
        assertEquals(10L, summary.getEstudiantes().getTotal());
        assertEquals(8L, summary.getEstudiantes().getActivos());
        assertEquals(2L, summary.getFacultades());
        assertEquals(3L, summary.getCarreras());
        assertEquals("Ciclo 1", summary.getEstudiantesPorCiclo().get(0).getEtiqueta());
        assertEquals(5, summary.getEstudiantesPorFacultad().get(0).getTotal());
        assertEquals(6L, summary.getDocentes().getTotal());
        assertEquals("PRINCIPAL", summary.getDocentesPorCategoria().get(0).getEtiqueta());
        assertEquals(3L, summary.getUsuarios().getActivos());
        assertEquals(42L, summary.getAuditoria().getEventosTotales());
        assertEquals(7, summary.getAuditoria().getEventosPorDia().size());
        assertNotNull(summary.getGeneradoEn());
    }

    @Test
    @DisplayName("Sin permisos no consulta métricas y deja los bloques en null")
    void ocultaBloquesSinPermisos() {
        when(permissionEvaluator.tiene(anyString())).thenReturn(false);
        when(universityRepository.findFirstByActiveTrueOrderByIdAsc()).thenReturn(Optional.empty());

        DtoResumenDashboard summary = service.getSummary();

        assertNotNull(summary.getInstitucion());
        assertNull(summary.getInstitucion().getNombre());
        assertNull(summary.getInstitucion().getPeriodo());
        assertNull(summary.getInstitucion().getSedesActivas());
        assertNull(summary.getEstudiantes());
        assertNull(summary.getDocentes());
        assertNull(summary.getUsuarios());
        assertNull(summary.getAuditoria());
        assertNull(summary.getFacultades());
        assertNull(summary.getEstudiantesPorCiclo());
        verifyNoInteractions(studentRepository, teacherRepository, userRepository, auditRepository);
    }

    @Test
    @DisplayName("Las sedes activas solo se incluyen con permiso SEDE_VIEW")
    void sedesSoloConPermiso() {
        when(permissionEvaluator.tiene(anyString())).thenReturn(false);
        when(permissionEvaluator.tiene("SEDE_VIEW")).thenReturn(true);
        when(universityRepository.findFirstByActiveTrueOrderByIdAsc()).thenReturn(Optional.of(universidad()));
        when(campusRepository.countByUniversityIdAndActiveTrue(7L)).thenReturn(2L);

        DtoResumenDashboard summary = service.getSummary();

        assertEquals(2L, summary.getInstitucion().getSedesActivas());
        assertNull(summary.getEstudiantes());
    }

    @Test
    @DisplayName("La serie de auditoría cubre siete días e incluye los días sin eventos en cero")
    void rellenaDiasSinEventos() {
        when(permissionEvaluator.tiene(anyString())).thenReturn(false);
        when(permissionEvaluator.tiene("AUDITORIA_VIEW")).thenReturn(true);
        when(universityRepository.findFirstByActiveTrueOrderByIdAsc()).thenReturn(Optional.empty());
        when(auditRepository.count()).thenReturn(0L);
        when(auditRepository.findTimestampsSince(any(LocalDateTime.class))).thenReturn(List.of());

        DtoResumenDashboard summary = service.getSummary();

        List<DtoConteoDashboard> events = summary.getAuditoria().getEventosPorDia();
        assertEquals(7, events.size());
        assertTrue(events.stream().allMatch(event -> event.getTotal() == 0));
        assertEquals(LocalDate.now().minusDays(6).toString(), events.get(0).getEtiqueta());
        assertEquals(LocalDate.now().toString(), events.get(6).getEtiqueta());
        verify(studentRepository, never()).count();
    }

    @Test
    @DisplayName("Agrupa los eventos por día y descarta marcas fuera de la ventana")
    void agrupaEventosPorDia() {
        when(permissionEvaluator.tiene(anyString())).thenReturn(false);
        when(permissionEvaluator.tiene("AUDITORIA_VIEW")).thenReturn(true);
        when(universityRepository.findFirstByActiveTrueOrderByIdAsc()).thenReturn(Optional.empty());
        when(auditRepository.count()).thenReturn(3L);
        LocalDateTime today = LocalDate.now().atTime(10, 0);
        when(auditRepository.findTimestampsSince(any(LocalDateTime.class))).thenReturn(List.of(
                today,
                today.plusHours(2),
                LocalDate.now().minusDays(3).atTime(9, 30)));

        DtoResumenDashboard summary = service.getSummary();

        List<DtoConteoDashboard> events = summary.getAuditoria().getEventosPorDia();
        assertEquals(2, events.get(6).getTotal());
        assertEquals(1, events.get(3).getTotal());
    }
}
