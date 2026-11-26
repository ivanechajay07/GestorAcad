package com.gestoracad.repository;

import com.gestoracad.entity.DocumentoConocimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio de documentos de la base de conocimiento.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Repository
public interface RepositorioDocumentoConocimiento extends JpaRepository<DocumentoConocimiento, Long> {

    List<DocumentoConocimiento> findByActiveTrueOrderByNameAsc();

    Optional<DocumentoConocimiento> findByNameIgnoreCase(String name);

    Optional<DocumentoConocimiento> findByIdAndActiveTrue(Long id);

    long countByActiveTrue();
}
