package com.gestoracad.service;

import com.gestoracad.dto.DtoGuardarConocimiento;
import com.gestoracad.dto.DtoRespuestaAsistente;
import com.gestoracad.entity.DocumentoConocimiento;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.repository.RepositorioDocumentoConocimiento;
import com.gestoracad.service.impl.ServicioConocimientoImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ServicioConocimientoTest {

    @Mock
    private RepositorioDocumentoConocimiento documentRepository;

    @Mock
    private ServicioAuditoria auditService;

    private ServicioConocimientoImpl knowledgeService;

    @BeforeEach
    void setUp() {
        knowledgeService = new ServicioConocimientoImpl(documentRepository, auditService);
    }

    private DocumentoConocimiento document(String name, String content) {
        DocumentoConocimiento document = new DocumentoConocimiento();
        document.setId(1L);
        document.setName(name);
        document.setCategory("ACADEMICO");
        document.setContent(content);
        document.setActive(true);
        return document;
    }

    @Test
    @DisplayName("Encuentra una fuente y devuelve un fragmento verificable")
    void answersFromKnowledgeBase() {
        when(documentRepository.findByActiveTrueOrderByNameAsc()).thenReturn(List.of(
                document("Estructura académica",
                        "La matrícula valida cupo, créditos y prerrequisitos antes de registrar al estudiante."),
                document("Seguridad", "Los permisos se agrupan por roles institucionales.")
        ));

        DtoRespuestaAsistente response = knowledgeService.ask("¿Cómo se valida la matrícula?");

        assertEquals("LOCAL", response.getMode());
        assertTrue(response.getAnswer().toLowerCase().contains("matrícula"));
        assertFalse(response.getSources().isEmpty());
        assertEquals("Estructura académica", response.getSources().get(0).getName());
    }

    @Test
    @DisplayName("Responde un saludo con una bienvenida local sin buscar fuentes")
    void answersGreetingWithWelcome() {
        DtoRespuestaAsistente response = knowledgeService.ask("Hola quisiera hacer una consulta");

        assertEquals("LOCAL", response.getMode());
        assertTrue(response.getAnswer().contains("matrícula"));
        assertTrue(response.getSources().isEmpty());
        assertTrue(response.isGreeting());
    }

    @Test
    @DisplayName("No confunde una pregunta académica con un saludo")
    void keepsAcademicQuestionAsSearch() {
        when(documentRepository.findByActiveTrueOrderByNameAsc()).thenReturn(List.of(
                document("Estructura académica",
                        "La matrícula valida cupo, créditos y prerrequisitos antes de registrar al estudiante.")
        ));

        DtoRespuestaAsistente response = knowledgeService.ask("Hola, ¿cómo registro una matrícula?");

        assertFalse(response.getSources().isEmpty());
        assertEquals("Estructura académica", response.getSources().get(0).getName());
        assertFalse(response.isGreeting());
    }

    @Test
    @DisplayName("Devuelve un mensaje claro cuando no hay coincidencias")
    void answersWithoutMatches() {
        when(documentRepository.findByActiveTrueOrderByNameAsc()).thenReturn(List.of(
                document("Seguridad", "Los permisos se agrupan por roles institucionales.")
        ));

        DtoRespuestaAsistente response = knowledgeService.ask("fotosíntesis vegetal");

        assertTrue(response.getAnswer().toLowerCase().contains("no encuentro"));
        assertTrue(response.getSources().isEmpty());
    }

    @Test
    @DisplayName("Rechaza una fuente duplicada activa")
    void rejectsDuplicateSource() {
        when(documentRepository.findByNameIgnoreCase("Guía")).thenReturn(Optional.of(
                document("Guía", "Contenido")
        ));

        DtoGuardarConocimiento dto = new DtoGuardarConocimiento();
        dto.setName("Guía");
        dto.setCategory("GENERAL");
        dto.setContent("Otro contenido");

        assertThrows(ExcepcionApi.class, () -> knowledgeService.createSource(dto, "127.0.0.1", "JUnit"));
    }
}
