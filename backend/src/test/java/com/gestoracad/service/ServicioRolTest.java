package com.gestoracad.service;

import com.gestoracad.dto.DtoRol;
import com.gestoracad.dto.DtoSolicitudRol;
import com.gestoracad.entity.Rol;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.mapper.MapeadorRol;
import com.gestoracad.repository.ProyeccionConteoRol;
import com.gestoracad.repository.RepositorioPermiso;
import com.gestoracad.repository.RepositorioRol;
import com.gestoracad.repository.RepositorioUsuario;
import com.gestoracad.service.impl.ServicioRolImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Pruebas unitarias del servicio de roles (TDD).
 * Verifican las reglas de negocio de unicidad y la protección del rol base.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@ExtendWith(MockitoExtension.class)
class ServicioRolTest {

    @Mock
    private RepositorioRol roleRepository;

    @Mock
    private RepositorioPermiso permissionRepository;

    @Mock
    private RepositorioUsuario userRepository;

    @Mock
    private MapeadorRol roleMapper;

    @Mock
    private ServicioAuditoria auditService;

    @InjectMocks
    private ServicioRolImpl roleService;

    private DtoSolicitudRol solicitud(String nombre) {
        DtoSolicitudRol dto = new DtoSolicitudRol();
        dto.setName(nombre);
        dto.setDescription("Rol de prueba");
        return dto;
    }

    private static ProyeccionConteoRol conteo(Long rolId, long total) {
        return new ProyeccionConteoRol() {
            @Override
            public Long getRolId() {
                return rolId;
            }

            @Override
            public long getTotal() {
                return total;
            }
        };
    }

    private static DtoRol dto(Long id, String nombre) {
        DtoRol dto = new DtoRol();
        dto.setId(id);
        dto.setName(nombre);
        return dto;
    }

    @Test
    @DisplayName("No permite crear un rol duplicado")
    void crearRolDuplicadoFalla() {
        when(roleRepository.existsByName("ROLE_TEST")).thenReturn(true);

        assertThrows(ExcepcionApi.class, () -> roleService.createRole(solicitud("test"), "127.0.0.1"));

        verify(roleRepository, never()).save(any(Rol.class));
    }

    @Test
    @DisplayName("No permite eliminar el rol base ROLE_UNIVERSIDAD")
    void eliminarRolBaseFalla() {
        Rol rolBase = new Rol("ROLE_UNIVERSIDAD", "Rol base");
        rolBase.setId(1L);
        when(roleRepository.findById(1L)).thenReturn(Optional.of(rolBase));

        assertThrows(ExcepcionApi.class, () -> roleService.deleteRole(1L, "127.0.0.1"));

        verify(roleRepository, never()).delete(any(Rol.class));
    }

    @Test
    @DisplayName("Elimina un rol no protegido")
    void eliminarRolNoProtegido() {
        Rol rol = new Rol("ROLE_DOCENTE", "Rol docente");
        rol.setId(2L);
        when(roleRepository.findById(2L)).thenReturn(Optional.of(rol));

        roleService.deleteRole(2L, "127.0.0.1");

        verify(roleRepository).delete(rol);
    }

    @Test
    @DisplayName("Crea un rol normalizando el nombre y devuelve su DTO")
    void crearRolNormalizaYDevuelveDto() {
        when(roleRepository.existsByName("ROLE_AUXILIAR")).thenReturn(false);
        when(roleRepository.save(any(Rol.class))).thenAnswer(invocacion -> {
            Rol guardado = invocacion.getArgument(0);
            guardado.setId(10L);
            return guardado;
        });
        when(roleMapper.toDto(any(Rol.class))).thenReturn(new DtoRol());

        DtoRol resultado = roleService.createRole(solicitud("auxiliar"), "127.0.0.1");

        assertNotNull(resultado);
        verify(roleRepository).save(any(Rol.class));
    }

    @Test
    @DisplayName("Lista los roles con la cantidad de usuarios asignados")
    void listaRolesConUsuariosAsignados() {
        Rol docente = new Rol("ROLE_DOCENTE", "Docente");
        docente.setId(2L);
        Rol estudiante = new Rol("ROLE_ESTUDIANTE", "Estudiante");
        estudiante.setId(3L);

        when(roleRepository.findAll()).thenReturn(List.of(docente, estudiante));
        when(userRepository.countUsuariosPorRol())
                .thenReturn(List.of(conteo(2L, 4L), conteo(3L, 7L)));
        when(roleMapper.toDto(docente)).thenReturn(dto(2L, "ROLE_DOCENTE"));
        when(roleMapper.toDto(estudiante)).thenReturn(dto(3L, "ROLE_ESTUDIANTE"));

        List<DtoRol> resultado = roleService.getAllRoles();

        assertEquals(2, resultado.size());
        assertEquals(4L, resultado.get(0).getUsuarios());
        assertEquals(7L, resultado.get(1).getUsuarios());
    }

    @Test
    @DisplayName("No permite eliminar un rol que tiene usuarios asignados")
    void eliminarRolConUsuariosFalla() {
        Rol rol = new Rol("ROLE_DOCENTE", "Rol docente");
        rol.setId(2L);
        when(roleRepository.findById(2L)).thenReturn(Optional.of(rol));
        when(userRepository.countByRoleId(2L)).thenReturn(3L);

        ExcepcionApi error = assertThrows(ExcepcionApi.class, () -> roleService.deleteRole(2L, "127.0.0.1"));

        assertTrue(error.getMessage().contains("3 usuarios asignados"));
        verify(roleRepository, never()).delete(any(Rol.class));
    }
}
