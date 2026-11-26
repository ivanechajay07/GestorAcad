package com.gestoracad.service;

import com.gestoracad.dto.DtoNotificacion;
import com.gestoracad.entity.Estudiante;
import com.gestoracad.entity.ParametroSistema;
import com.gestoracad.entity.Rol;
import com.gestoracad.entity.Universidad;
import com.gestoracad.entity.Usuario;
import com.gestoracad.repository.RepositorioCalificacion;
import com.gestoracad.repository.RepositorioDocente;
import com.gestoracad.repository.RepositorioEstudiante;
import com.gestoracad.repository.RepositorioParametroSistema;
import com.gestoracad.repository.RepositorioRegistroAuditoria;
import com.gestoracad.repository.RepositorioUniversidad;
import com.gestoracad.repository.RepositorioUsuario;
import com.gestoracad.security.EvaluadorPermisos;
import com.gestoracad.service.impl.ServicioNotificacionesImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Pruebas unitarias de los avisos del encabezado.
 * Verifican el filtrado por permisos, el orden por severidad y que los textos
 * se construyan solo con agregados institucionales.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@ExtendWith(MockitoExtension.class)
class ServicioNotificacionesTest {

    @Mock
    private RepositorioEstudiante studentRepository;
    @Mock
    private RepositorioDocente teacherRepository;
    @Mock
    private RepositorioUsuario userRepository;
    @Mock
    private RepositorioRegistroAuditoria auditRepository;
    @Mock
    private RepositorioUniversidad universityRepository;
    @Mock
    private RepositorioParametroSistema parameterRepository;
    @Mock
    private RepositorioCalificacion gradeRepository;
    @Mock
    private EvaluadorPermisos permissionEvaluator;

    @InjectMocks
    private ServicioNotificacionesImpl service;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private static Universidad universidad(String licensingStatus) {
        Universidad university = new Universidad();
        university.setName("Universidad Nacional de Innovación & Tecnología");
        university.setShortName("UNINTEP");
        university.setLicensingStatus(licensingStatus);
        return university;
    }

    private static ParametroSistema periodo(String valor) {
        ParametroSistema parameter = new ParametroSistema();
        parameter.setKey("PERIODO_ACADEMICO_ACTUAL");
        parameter.setValue(valor);
        return parameter;
    }

    @Test
    @DisplayName("Con permisos genera avisos agregados y prioriza las advertencias")
    void generaAvisosConTodosLosPermisos() {
        when(permissionEvaluator.tiene(anyString())).thenReturn(true);
        when(studentRepository.count()).thenReturn(10L);
        when(studentRepository.countByActiveTrue()).thenReturn(8L);
        when(teacherRepository.count()).thenReturn(6L);
        when(teacherRepository.countByActiveTrue()).thenReturn(5L);
        when(userRepository.count()).thenReturn(3L);
        when(userRepository.countByActiveTrue()).thenReturn(2L);
        when(parameterRepository.findByKey("PERIODO_ACADEMICO_ACTUAL"))
                .thenReturn(Optional.of(periodo("2026-I")));
        when(auditRepository.countByTimestampAfter(any(LocalDateTime.class))).thenReturn(4L);
        when(universityRepository.findFirstByActiveTrueOrderByIdAsc())
                .thenReturn(Optional.of(universidad("LICENCIADA")));

        List<DtoNotificacion> notifications = service.getNotificaciones();

        assertEquals(6, notifications.size());
        assertEquals("advertencia", notifications.get(0).getTipo());
        assertEquals("2 estudiantes inactivos", notifications.get(0).getTitulo());
        assertEquals("1 docente inactivo", notifications.get(1).getTitulo());
        assertEquals("1 cuenta inactiva", notifications.get(2).getTitulo());
        assertEquals("Periodo 2026-I activo", notifications.get(3).getTitulo());
        assertEquals("4 eventos auditados esta semana", notifications.get(4).getTitulo());
        assertEquals("Licenciamiento LICENCIADA", notifications.get(5).getTitulo());
        assertEquals("/students", notifications.get(0).getEnlace());
        assertEquals("/audit", notifications.get(4).getEnlace());
        assertEquals("exito", notifications.get(5).getTipo());
        assertTrue(notifications.stream().noneMatch(notification ->
                notification.getTitulo().contains("@")
                        || notification.getDetalle().contains("@")));
    }

    @Test
    @DisplayName("Sin permisos ni configuración institucional no devuelve avisos")
    void sinPermisosNoDevuelveAvisos() {
        when(permissionEvaluator.tiene(anyString())).thenReturn(false);
        when(parameterRepository.findByKey("PERIODO_ACADEMICO_ACTUAL")).thenReturn(Optional.empty());
        when(universityRepository.findFirstByActiveTrueOrderByIdAsc()).thenReturn(Optional.empty());

        List<DtoNotificacion> notifications = service.getNotificaciones();

        assertTrue(notifications.isEmpty());
        verifyNoInteractions(studentRepository, teacherRepository, userRepository, auditRepository);
    }

    @Test
    @DisplayName("No enlaza módulos restringidos cuando falta el permiso de universidad")
    void noEnlazaModulosSinPermiso() {
        when(permissionEvaluator.tiene(anyString())).thenReturn(false);
        when(parameterRepository.findByKey("PERIODO_ACADEMICO_ACTUAL"))
                .thenReturn(Optional.of(periodo("2026-II")));
        when(universityRepository.findFirstByActiveTrueOrderByIdAsc())
                .thenReturn(Optional.of(universidad("EN EVALUACIÓN")));

        List<DtoNotificacion> notifications = service.getNotificaciones();

        assertEquals(2, notifications.size());
        assertNull(notifications.get(0).getEnlace());
        assertNull(notifications.get(1).getEnlace());
        assertEquals("advertencia", notifications.get(0).getTipo());
        assertFalse(notifications.get(0).getId().contains(" "));
        verify(auditRepository, never()).countByTimestampAfter(any(LocalDateTime.class));
    }

    @Test
    @DisplayName("No genera avisos de inactividad cuando todos los registros están activos")
    void omiteAvisosSinInactivos() {
        when(permissionEvaluator.tiene(anyString())).thenReturn(true);
        when(studentRepository.count()).thenReturn(6L);
        when(studentRepository.countByActiveTrue()).thenReturn(6L);
        when(teacherRepository.count()).thenReturn(5L);
        when(teacherRepository.countByActiveTrue()).thenReturn(5L);
        when(userRepository.count()).thenReturn(3L);
        when(userRepository.countByActiveTrue()).thenReturn(3L);
        when(parameterRepository.findByKey("PERIODO_ACADEMICO_ACTUAL")).thenReturn(Optional.empty());
        when(auditRepository.countByTimestampAfter(any(LocalDateTime.class))).thenReturn(0L);
        when(universityRepository.findFirstByActiveTrueOrderByIdAsc()).thenReturn(Optional.empty());

        List<DtoNotificacion> notifications = service.getNotificaciones();

        assertTrue(notifications.isEmpty());
    }

    @Test
    @DisplayName("Agrega un aviso de notas recientes para el estudiante autenticado")
    void agregaAvisoNotasRecientes() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("lucia", null,
                        List.of(new SimpleGrantedAuthority("ROLE_ESTUDIANTE"))));

        Rol role = new Rol();
        role.setName("ROLE_ESTUDIANTE");
        Usuario user = new Usuario();
        user.setId(5L);
        user.setRoles(Set.of(role));

        Estudiante student = new Estudiante();
        student.setId(9L);

        when(userRepository.findByUsernameWithRolesAndPermissions("lucia")).thenReturn(Optional.of(user));
        when(studentRepository.findByUserId(5L)).thenReturn(Optional.of(student));
        when(gradeRepository.countRecentByStudentId(eq(9L), any(LocalDateTime.class))).thenReturn(3L);
        when(gradeRepository.findLatestUpdateByStudentId(eq(9L), any(LocalDateTime.class)))
                .thenReturn(LocalDateTime.now().minusDays(1));
        when(permissionEvaluator.tiene(anyString())).thenReturn(false);
        when(parameterRepository.findByKey(anyString())).thenReturn(Optional.empty());
        when(universityRepository.findFirstByActiveTrueOrderByIdAsc()).thenReturn(Optional.empty());

        List<DtoNotificacion> notifications = service.getNotificaciones();

        assertEquals(1, notifications.size());
        assertEquals("3 notas publicadas", notifications.get(0).getTitulo());
        assertEquals("/my-progress", notifications.get(0).getEnlace());
        assertEquals("info", notifications.get(0).getTipo());
        assertTrue(notifications.get(0).getDetalle().contains("calificaciones"));
    }
}
