package com.gestoracad.repository;

import com.gestoracad.entity.ParametroSistema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para la entidad ParametroSistema.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioParametroSistema extends JpaRepository<ParametroSistema, Long> {

    Optional<ParametroSistema> findByKey(String key);

    boolean existsByKey(String key);

    List<ParametroSistema> findAllByOrderByModuleAscKeyAsc();
}
