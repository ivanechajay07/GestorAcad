package com.gestoracad.repository;

import com.gestoracad.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para la entidad Usuario.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioUsuario extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByUsername(String username);
    Optional<Usuario> findByEmail(String email);

    @Query("SELECT u FROM Usuario u LEFT JOIN FETCH u.roles r LEFT JOIN FETCH r.permissions WHERE u.username = :username")
    Optional<Usuario> findByUsernameWithRolesAndPermissions(@Param("username") String username);

    @Query("SELECT u FROM Usuario u LEFT JOIN FETCH u.roles r LEFT JOIN FETCH r.permissions WHERE u.email = :email")
    Optional<Usuario> findByEmailWithRolesAndPermissions(@Param("email") String email);

    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    long countByActiveTrue();

    /**
     * Cuenta los usuarios asignados a cada rol en una sola consulta agrupada.
     * Se usa para enriquecer el catálogo de roles sin cargar las entidades.
     */
    @Query("SELECT r.id AS rolId, COUNT(u) AS total FROM Usuario u JOIN u.roles r GROUP BY r.id")
    List<ProyeccionConteoRol> countUsuariosPorRol();

    /** Cuenta los usuarios que tienen asignado un rol concreto. */
    @Query("SELECT COUNT(u) FROM Usuario u JOIN u.roles r WHERE r.id = :rolId")
    long countByRoleId(@Param("rolId") Long rolId);

    /** Cuenta las cuentas activas que poseen un rol concreto. */
    @Query("SELECT COUNT(u) FROM Usuario u JOIN u.roles r WHERE u.active = true AND r.name = :roleName")
    long countActiveByRoleName(@Param("roleName") String roleName);
}
