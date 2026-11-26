package com.gestoracad.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Documento de la base de conocimiento del asistente académico.
 * El contenido se guarda en texto plano y se recupera mediante búsqueda local.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Entity
@Table(name = "tb_conocimiento_documentos")
public class DocumentoConocimiento extends EntidadBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre", nullable = false, unique = true, length = 160)
    private String name;

    @Column(name = "categoria", nullable = false, length = 60)
    private String category = "GENERAL";

    @Column(name = "contenido", nullable = false, columnDefinition = "MEDIUMTEXT")
    private String content;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
