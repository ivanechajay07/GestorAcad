package com.gestoracad.service;

import com.gestoracad.dto.DtoEstadoAsistente;
import com.gestoracad.dto.DtoMensajeAsistente;
import com.gestoracad.dto.DtoRespuestaAsistente;
import com.gestoracad.service.impl.ServicioAsistenteGptImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * Pruebas del asistente GPT con recuperación local y fallback.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@ExtendWith(MockitoExtension.class)
class ServicioAsistenteGptTest {

    private static final String BASE_URL = "https://api.openai.test/v1";

    @Mock
    private ServicioConocimiento localService;

    private DtoRespuestaAsistente localAnswer() {
        DtoRespuestaAsistente.Fuente source = new DtoRespuestaAsistente.Fuente();
        source.setId(1L);
        source.setName("Estructura académica");
        source.setCategory("ACADEMICO");
        source.setSnippet("La matrícula valida cupo y prerrequisitos.");
        source.setScore(12);

        DtoRespuestaAsistente response = new DtoRespuestaAsistente();
        response.setAnswer("La matrícula valida cupo y prerrequisitos.");
        response.setMode("LOCAL");
        response.setSources(List.of(source));
        return response;
    }

    private DtoMensajeAsistente message(String role, String content) {
        DtoMensajeAsistente message = new DtoMensajeAsistente();
        message.setRole(role);
        message.setContent(content);
        return message;
    }

    private ServicioAsistenteGptImpl service(String mode, String apiKey, MockRestServiceServer[] holder) {
        RestClient.Builder builder = RestClient.builder();
        holder[0] = MockRestServiceServer.bindTo(builder).build();
        return new ServicioAsistenteGptImpl(
                localService, builder, mode, apiKey, BASE_URL, "gpt-4o-mini", 800, 0.2);
    }

    @Test
    @DisplayName("En modo local usa la búsqueda local sin llamar al proveedor")
    void usesLocalSearchWhenModeIsLocal() {
        when(localService.ask("matrícula")).thenReturn(localAnswer());
        MockRestServiceServer[] server = new MockRestServiceServer[1];
        ServicioAsistenteGptImpl assistant = service("local", "sk-test", server);

        DtoRespuestaAsistente response = assistant.chat("matrícula", List.of());

        assertEquals("LOCAL", response.getMode());
        assertFalse(response.getSources().isEmpty());
        server[0].verify();
    }

    @Test
    @DisplayName("Sin clave de API vuelve a la búsqueda local")
    void fallsBackWhenApiKeyIsMissing() {
        when(localService.ask("matrícula")).thenReturn(localAnswer());
        MockRestServiceServer[] server = new MockRestServiceServer[1];
        ServicioAsistenteGptImpl assistant = service("gpt", "", server);

        DtoRespuestaAsistente response = assistant.chat("matrícula", List.of());

        assertEquals("LOCAL", response.getMode());
        DtoEstadoAsistente status = assistant.status();
        assertFalse(status.isGptEnabled());
        assertEquals("LOCAL", status.getMode());
        assertNull(status.getModel());
    }

    @Test
    @DisplayName("Sin fuentes locales no se inventa una respuesta ni se llama a GPT")
    void skipsGptWhenThereIsNoContext() {
        DtoRespuestaAsistente empty = new DtoRespuestaAsistente();
        empty.setAnswer("No encuentro información sobre eso.");
        when(localService.ask("fotosíntesis")).thenReturn(empty);
        MockRestServiceServer[] server = new MockRestServiceServer[1];
        ServicioAsistenteGptImpl assistant = service("gpt", "sk-test", server);

        DtoRespuestaAsistente response = assistant.chat("fotosíntesis", List.of());

        assertEquals("LOCAL", response.getMode());
        assertTrue(response.getAnswer().contains("No encuentro"));
        server[0].verify();
    }

    @Test
    @DisplayName("Con GPT disponible devuelve la respuesta RAG con las fuentes locales")
    void returnsRagAnswerWithSources() {
        when(localService.ask("matrícula")).thenReturn(localAnswer());
        MockRestServiceServer[] server = new MockRestServiceServer[1];
        ServicioAsistenteGptImpl assistant = service("gpt", "sk-test", server);

        server[0]
                .expect(requestTo(BASE_URL + "/chat/completions"))
                .andExpect(header("Authorization", "Bearer sk-test"))
                .andExpect(content().string(containsString("CONTEXTO:")))
                .andExpect(content().string(containsString("Estructura académica")))
                .andExpect(content().string(containsString("matrícula")))
                .andRespond(withSuccess(
                        """
                        {"choices":[{"message":{"content":"Según [Estructura académica], la matrícula valida cupo."}}]}
                        """,
                        MediaType.APPLICATION_JSON));

        DtoRespuestaAsistente response = assistant.chat("matrícula", List.of());

        assertEquals("RAG", response.getMode());
        assertTrue(response.getAnswer().contains("[Estructura académica]"));
        assertEquals(1, response.getSources().size());
        server[0].verify();
    }

    @Test
    @DisplayName("Si el proveedor falla se devuelve la respuesta local")
    void fallsBackWhenProviderFails() {
        when(localService.ask("matrícula")).thenReturn(localAnswer());
        MockRestServiceServer[] server = new MockRestServiceServer[1];
        ServicioAsistenteGptImpl assistant = service("rag", "sk-test", server);

        server[0]
                .expect(requestTo(BASE_URL + "/chat/completions"))
                .andRespond(withServerError().body("cuota agotada").contentType(MediaType.TEXT_PLAIN));

        DtoRespuestaAsistente response = assistant.chat("matrícula", List.of());

        assertEquals("LOCAL", response.getMode());
        assertFalse(response.getSources().isEmpty());
        server[0].verify();
    }

    @Test
    @DisplayName("Envía el historial de la conversación a GPT para seguimientos")
    void sendsConversationHistoryToGpt() {
        DtoRespuestaAsistente empty = new DtoRespuestaAsistente();
        empty.setAnswer("No encuentro información sobre eso.");
        when(localService.ask("¿y los prerrequisitos?")).thenReturn(empty);
        MockRestServiceServer[] server = new MockRestServiceServer[1];
        ServicioAsistenteGptImpl assistant = service("gpt", "sk-test", server);

        server[0]
                .expect(requestTo(BASE_URL + "/chat/completions"))
                .andExpect(content().string(containsString("¿Cómo se registra una matrícula?")))
                .andExpect(content().string(containsString("La matrícula valida cupo y prerrequisitos.")))
                .andRespond(withSuccess(
                        """
                        {"choices":[{"message":{"content":"Los prerrequisitos se validan al registrar la matrícula."}}]}
                        """,
                        MediaType.APPLICATION_JSON));

        DtoRespuestaAsistente response = assistant.chat(
                "¿y los prerrequisitos?",
                List.of(
                        message("user", "¿Cómo se registra una matrícula?"),
                        message("assistant", "La matrícula valida cupo y prerrequisitos.")));

        assertEquals("GPT", response.getMode());
        assertTrue(response.getSources().isEmpty());
        assertTrue(response.getAnswer().contains("prerrequisitos"));
        server[0].verify();
    }

    @Test
    @DisplayName("Los saludos se resuelven localmente sin llamar a GPT")
    void doesNotCallGptForGreeting() {
        DtoRespuestaAsistente greeting = new DtoRespuestaAsistente();
        greeting.setAnswer("Hola. Puedo ayudarte con matrícula y cursos.");
        greeting.setGreeting(true);
        when(localService.ask("Hola")).thenReturn(greeting);
        MockRestServiceServer[] server = new MockRestServiceServer[1];
        ServicioAsistenteGptImpl assistant = service("gpt", "sk-test", server);

        DtoRespuestaAsistente response = assistant.chat("Hola", List.of());

        assertEquals("LOCAL", response.getMode());
        assertTrue(response.isGreeting());
        server[0].verify();
    }

    @Test
    @DisplayName("El estado solo anuncia RAG cuando hay modo y clave configurados")
    void reportsRagStatusWhenConfigured() {
        MockRestServiceServer[] server = new MockRestServiceServer[1];
        ServicioAsistenteGptImpl assistant = service("rag", "sk-test", server);

        DtoEstadoAsistente status = assistant.status();

        assertTrue(status.isGptEnabled());
        assertEquals("RAG", status.getMode());
        assertEquals("openai", status.getProvider());
        assertEquals("gpt-4o-mini", status.getModel());
    }
}
