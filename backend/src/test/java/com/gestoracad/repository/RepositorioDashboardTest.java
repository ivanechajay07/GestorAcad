package com.gestoracad.repository;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.config.ConfiguracionAuditoriaJpa;
import com.gestoracad.entity.Carrera;
import com.gestoracad.entity.Docente;
import com.gestoracad.entity.Estudiante;
import com.gestoracad.entity.Facultad;
import com.gestoracad.entity.RegistroAuditoria;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.AuditorAware;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pruebas de las consultas de agregación del panel institucional.
 * Validan que los conteos se calculen en la base de datos, que excluyan
 * registros inactivos y que la serie de auditoría respete la ventana temporal.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@DataJpaTest
@ActiveProfiles("test")
@Import({ConfiguracionAuditoriaJpa.class, RepositorioDashboardTest.AuditoriaTestConfig.class})
class RepositorioDashboardTest {

    @TestConfiguration
    static class AuditoriaTestConfig {
        @Bean(name = "auditorActualImpl")
        AuditorAware<String> auditorActualImpl() {
            return () -> Optional.of("JUNIT");
        }
    }

    @Autowired
    private RepositorioEstudiante studentRepository;

    @Autowired
    private RepositorioDocente teacherRepository;

    @Autowired
    private RepositorioRegistroAuditoria auditRepository;

    @Autowired
    private RepositorioFacultad facultyRepository;

    @Autowired
    private RepositorioCarrera careerRepository;

    private Facultad facultad(String name) {
        return facultyRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> facultyRepository.save(new Facultad(name)));
    }

    private Carrera carrera(String name, Facultad faculty) {
        return careerRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> careerRepository.save(new Carrera(name, faculty)));
    }

    private Estudiante estudiante(String code, String faculty, String career, int cycle, boolean active) {
        Facultad catalogFaculty = facultad(faculty);
        Estudiante student = new Estudiante();
        student.setCode(code);
        student.setFirstName("Nombre");
        student.setLastName("Apellido");
        student.setFaculty(catalogFaculty);
        student.setCareer(carrera(career, catalogFaculty));
        student.setCurrentCycle(cycle);
        student.setActive(active);
        return studentRepository.save(student);
    }

    private Docente docente(String code, String category, String faculty, boolean active) {
        Docente teacher = new Docente();
        teacher.setCode(code);
        teacher.setFirstName("Nombre");
        teacher.setLastName("Apellido");
        teacher.setCategory(category);
        teacher.setFaculty(facultad(faculty));
        teacher.setActive(active);
        return teacherRepository.save(teacher);
    }

    private RegistroAuditoria evento(String username, LocalDateTime timestamp) {
        RegistroAuditoria log = new RegistroAuditoria(null, username, AccionAuditoria.VIEW,
                "DASHBOARD", "Consulta de prueba", "/api/v1/dashboard/summary", "GET", "127.0.0.1", "EXITOSO");
        log.setTimestamp(timestamp);
        return auditRepository.save(log);
    }

    @BeforeEach
    void setUp() {
        estudiante("EST-001", "Facultad de Ingeniería", "Ingeniería de Sistemas", 1, true);
        estudiante("EST-002", "Facultad de Salud", "Medicina Humana", 2, true);
        estudiante("EST-003", "Facultad de Ingeniería", "Ingeniería de Sistemas", 1, false);

        docente("DOC-001", "PRINCIPAL", "Facultad de Ingeniería", true);
        docente("DOC-002", "PRINCIPAL", "Facultad de Salud", true);
        docente("DOC-003", "ASOCIADO", "Facultad de Ingeniería", false);

        evento("admin", LocalDateTime.now());
        evento("admin", LocalDateTime.now().minusHours(2));
        evento("admin", LocalDateTime.now().minusDays(2));
    }

    @Test
    @DisplayName("Los conteos de estudiantes excluyen registros inactivos")
    void cuentaEstudiantesActivos() {
        assertEquals(3L, studentRepository.count());
        assertEquals(2L, studentRepository.countByActiveTrue());
        assertEquals(2L, studentRepository.countActiveFaculties());
        assertEquals(2L, studentRepository.countActiveCareers());
    }

    @Test
    @DisplayName("Agrupa estudiantes activos por ciclo, facultad y carrera")
    void agrupaEstudiantesActivos() {
        Map<Integer, Long> byCycle = studentRepository.countActiveByCycle().stream()
                .collect(Collectors.toMap(ProyeccionConteoCiclo::getEtiqueta, ProyeccionConteoCiclo::getTotal));
        assertEquals(1L, byCycle.get(1));
        assertEquals(1L, byCycle.get(2));

        Map<String, Long> byFaculty = toMap(studentRepository.countActiveByFaculty());
        assertEquals(1L, byFaculty.get("Facultad de Ingeniería"));
        assertEquals(1L, byFaculty.get("Facultad de Salud"));

        Map<String, Long> byCareer = toMap(studentRepository.countActiveByCareer());
        assertEquals(1L, byCareer.get("Ingeniería de Sistemas"));
        assertEquals(1L, byCareer.get("Medicina Humana"));
    }

    @Test
    @DisplayName("Agrupa docentes activos por categoría y facultad")
    void agrupaDocentesActivos() {
        assertEquals(3L, teacherRepository.count());
        assertEquals(2L, teacherRepository.countByActiveTrue());

        Map<String, Long> byCategory = toMap(teacherRepository.countActiveByCategory());
        assertEquals(2L, byCategory.get("PRINCIPAL"));
        assertEquals(1, byCategory.size());

        Map<String, Long> byFaculty = toMap(teacherRepository.countActiveByFaculty());
        assertEquals(1L, byFaculty.get("Facultad de Ingeniería"));
        assertEquals(1L, byFaculty.get("Facultad de Salud"));
    }

    @Test
    @DisplayName("findTimestampsSince devuelve solo las marcas dentro de la ventana y en orden")
    void recuperaMarcasDeTiempoEnVentana() {
        LocalDateTime desde = LocalDate.now().minusDays(1).atStartOfDay();
        List<LocalDateTime> timestamps = auditRepository.findTimestampsSince(desde);

        assertEquals(2, timestamps.size());
        assertTrue(timestamps.get(0).isBefore(timestamps.get(1)));
        assertTrue(timestamps.stream().allMatch(timestamp -> !timestamp.isBefore(desde)));
    }

    private Map<String, Long> toMap(List<ProyeccionConteoTexto> counts) {
        return counts.stream().collect(Collectors.toMap(
                ProyeccionConteoTexto::getEtiqueta,
                ProyeccionConteoTexto::getTotal,
                Long::sum,
                java.util.LinkedHashMap::new));
    }
}
