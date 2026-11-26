package com.gestoracad.repository;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.entity.RegistroAuditoria;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repositorio JPA para la entidad RegistroAuditoria.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioRegistroAuditoria extends JpaRepository<RegistroAuditoria, Long> {
    List<RegistroAuditoria> findTop100ByOrderByTimestampDesc();
    Page<RegistroAuditoria> findByUsername(String username, Pageable pageable);
    Page<RegistroAuditoria> findByModule(String module, Pageable pageable);
    Page<RegistroAuditoria> findByAction(AccionAuditoria action, Pageable pageable);
    Page<RegistroAuditoria> findByTimestampBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    /**
     * Obtiene únicamente las marcas de tiempo posteriores a {@code desde}.
     * Evita cargar entidades completas y permite agrupar por día en la capa de
     * servicio sin depender de funciones de fecha específicas del motor SQL.
     */
    @Query("SELECT r.timestamp FROM RegistroAuditoria r WHERE r.timestamp >= :desde ORDER BY r.timestamp ASC")
    List<LocalDateTime> findTimestampsSince(@Param("desde") LocalDateTime desde);

    /**
     * Cuenta los eventos registrados después de una marca temporal.
     * Se usa para los avisos agregados del encabezado sin cargar entidades.
     */
    long countByTimestampAfter(LocalDateTime desde);

    /** Cuenta los eventos dentro de una ventana semiabierta {@code [desde, hasta)}. */
    @Query("SELECT COUNT(r) FROM RegistroAuditoria r WHERE r.timestamp >= :desde AND r.timestamp < :hasta")
    long countBetween(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    /** Cuenta los eventos de un resultado concreto dentro de la ventana. */
    @Query("SELECT COUNT(r) FROM RegistroAuditoria r "
            + "WHERE r.result = :resultado AND r.timestamp >= :desde AND r.timestamp < :hasta")
    long countByResultBetween(@Param("resultado") String resultado,
                              @Param("desde") LocalDateTime desde,
                              @Param("hasta") LocalDateTime hasta);

    /**
     * Obtiene las marcas de tiempo de la ventana para agruparlas por día
     * institucional en la capa de servicio, sin depender de funciones de fecha
     * específicas del motor SQL.
     */
    @Query("SELECT r.timestamp FROM RegistroAuditoria r "
            + "WHERE r.timestamp >= :desde AND r.timestamp < :hasta ORDER BY r.timestamp ASC")
    List<LocalDateTime> findTimestampsBetween(@Param("desde") LocalDateTime desde,
                                              @Param("hasta") LocalDateTime hasta);

    /** Distribución de eventos por acción dentro de la ventana. */
    @Query("SELECT r.action AS accion, COUNT(r) AS total FROM RegistroAuditoria r "
            + "WHERE r.timestamp >= :desde AND r.timestamp < :hasta "
            + "GROUP BY r.action ORDER BY COUNT(r) DESC, r.action ASC")
    List<ProyeccionConteoAccion> countByActionBetween(@Param("desde") LocalDateTime desde,
                                                      @Param("hasta") LocalDateTime hasta);
}
