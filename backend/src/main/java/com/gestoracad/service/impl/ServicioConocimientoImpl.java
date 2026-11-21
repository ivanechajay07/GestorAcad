package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoFuenteConocimiento;
import com.gestoracad.dto.DtoGuardarConocimiento;
import com.gestoracad.dto.DtoRespuestaAsistente;
import com.gestoracad.entity.DocumentoConocimiento;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.repository.RepositorioDocumentoConocimiento;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioConocimiento;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Búsqueda local sobre la base de conocimiento.
 * No se conecta a un proveedor de IA: puntúa coincidencias léxicas y devuelve
 * fragmentos verificables de los documentos activos.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioConocimientoImpl implements ServicioConocimiento {

    private static final String MODULE = "CONOCIMIENTO";
    private static final String BASE_ENDPOINT = "/api/v1/knowledge";
    private static final int MAX_SOURCES = 3;
    private static final int SNIPPET_LENGTH = 560;

    private static final Set<String> STOP_WORDS = Set.of(
            "para", "como", "donde", "desde", "este", "esta", "estos", "estas", "sobre",
            "entre", "cuando", "porque", "quiero", "puedo", "tengo", "hacer", "hola",
            "gracias", "favor", "cual", "cuales", "que", "con", "por", "los", "las",
            "del", "una", "uno", "unos", "unas", "sus", "mas", "muy", "sin", "mis",
            "tus", "hay", "ver", "saber", "consulta", "consultar", "informacion",
            "academico", "academica", "gestor", "virtual"
    );

    /**
     * Palabras que, por sí solas, forman un saludo o una solicitud de orientación.
     * Si la consulta contiene cualquier otra palabra, se trata como búsqueda.
     */
    private static final Set<String> CONVERSATIONAL_WORDS = Set.of(
            "hola", "buenas", "buenos", "buen", "dia", "dias", "tarde", "tardes",
            "noche", "noches", "saludos", "hey", "tal", "quisiera", "quiero", "deseo",
            "necesito", "tengo", "hacer", "una", "un", "consulta", "consultar",
            "pregunta", "duda", "informacion", "orientacion", "ayuda", "ayudarme",
            "puedes", "podrias", "por", "favor", "porfa", "gracias", "como", "estas",
            "esta", "que", "va", "bien", "mucho", "gusto", "saludar"
    );

    private static final String WELCOME_MESSAGE =
            "Hola. Puedo ayudarte con matrícula, cursos, actas, periodos académicos, "
            + "portales, roles y permisos. Escribe tu consulta con un poco de detalle; "
            + "por ejemplo: «¿Cómo se registra una matrícula?».";

    private final RepositorioDocumentoConocimiento documentRepository;
    private final ServicioAuditoria auditService;

    public ServicioConocimientoImpl(RepositorioDocumentoConocimiento documentRepository,
                                    ServicioAuditoria auditService) {
        this.documentRepository = documentRepository;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoFuenteConocimiento> listSources() {
        return documentRepository.findByActiveTrueOrderByNameAsc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DtoFuenteConocimiento createSource(DtoGuardarConocimiento dto, String clientIp, String userAgent) {
        String name = dto.getName().trim();
        if (documentRepository.findByNameIgnoreCase(name)
                .filter(document -> document.isActive())
                .isPresent()) {
            throw new ExcepcionApi("Ya existe una fuente activa con el nombre '" + name + "'");
        }

        DocumentoConocimiento document = documentRepository.findByNameIgnoreCase(name)
                .orElseGet(DocumentoConocimiento::new);
        document.setName(name);
        document.setCategory(dto.getCategory().trim().toUpperCase(Locale.ROOT));
        document.setContent(dto.getContent().trim());
        document.setActive(true);
        document.setDeletedAt(null);
        DocumentoConocimiento saved = documentRepository.save(document);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, MODULE,
                "Fuente de conocimiento registrada: " + saved.getName(),
                BASE_ENDPOINT + "/sources", "POST", clientIp, "SUCCESS", userAgent,
                "tb_conocimiento_documentos", saved.getId());

        return toDto(saved);
    }

    @Override
    @Transactional
    public void deleteSource(Long id, String clientIp, String userAgent) {
        DocumentoConocimiento document = documentRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Fuente de conocimiento", "id", id));
        document.setActive(false);
        document.setDeletedAt(LocalDateTime.now());
        documentRepository.save(document);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, MODULE,
                "Fuente de conocimiento desactivada: " + document.getName(),
                BASE_ENDPOINT + "/sources/" + id, "DELETE", clientIp, "SUCCESS", userAgent,
                "tb_conocimiento_documentos", id);
    }

    @Override
    @Transactional(readOnly = true)
    public DtoRespuestaAsistente ask(String question) {
        String normalizedQuestion = normalize(question);
        DtoRespuestaAsistente response = new DtoRespuestaAsistente();
        response.setMode("LOCAL");

        if (isConversationalIntent(normalizedQuestion)) {
            response.setAnswer(WELCOME_MESSAGE);
            response.setGreeting(true);
            return response;
        }

        Set<String> terms = extractTerms(normalizedQuestion);

        if (terms.isEmpty()) {
            response.setAnswer("Necesito un poco más de contexto para buscar en las fuentes. "
                    + "Prueba con una pregunta completa sobre periodos, cursos, matrícula, evaluación o roles.");
            return response;
        }

        List<DocumentoConocimiento> documents = documentRepository.findByActiveTrueOrderByNameAsc();
        List<ScoredDocument> ranked = documents.stream()
                .map(document -> score(document, normalizedQuestion, terms))
                .filter(scored -> scored.score() > 0)
                .sorted(Comparator.comparingInt(ScoredDocument::score).reversed())
                .limit(MAX_SOURCES)
                .collect(Collectors.toList());

        if (ranked.isEmpty()) {
            response.setAnswer("No encuentro esa respuesta en las fuentes disponibles. "
                    + "Prueba con otras palabras o solicita a la institución agregar una guía académica.");
            return response;
        }

        ScoredDocument top = ranked.get(0);
        StringBuilder answer = new StringBuilder("Según «")
                .append(top.document().getName())
                .append("»: ")
                .append(top.snippet());
        if (ranked.size() > 1 && ranked.get(1).score() >= Math.max(1, top.score() / 2)) {
            ScoredDocument second = ranked.get(1);
            answer.append("\n\nTambién puedes revisar «")
                    .append(second.document().getName())
                    .append("»: ")
                    .append(second.snippet());
        }
        response.setAnswer(answer.toString());
        response.setSources(ranked.stream().map(this::toSource).collect(Collectors.toList()));
        return response;
    }

    private ScoredDocument score(DocumentoConocimiento document, String normalizedQuestion, Set<String> terms) {
        String name = normalize(document.getName());
        String category = normalize(document.getCategory());
        String content = normalize(document.getContent());
        int score = 0;
        int matches = 0;

        for (String term : terms) {
            int nameHits = countMatches(name, term);
            int categoryHits = countMatches(category, term);
            int contentHits = countMatches(content, term);
            if (nameHits + categoryHits + contentHits > 0) {
                matches++;
            }
            score += nameHits * 7 + categoryHits * 3 + Math.min(contentHits, 18);
        }
        if (!normalizedQuestion.isBlank() && content.contains(normalizedQuestion)) {
            score += 12;
        }
        score += matches * 2;

        return new ScoredDocument(document, score, buildSnippet(document.getContent(), terms));
    }

    private String buildSnippet(String content, Set<String> terms) {
        String[] parts = content.split("(?<=[.!?])\\s+|\\R+");
        int bestIndex = -1;
        int bestMatches = -1;
        for (int index = 0; index < parts.length; index++) {
            String normalized = normalize(parts[index]);
            int matches = (int) terms.stream().filter(normalized::contains).count();
            if (matches > bestMatches) {
                bestMatches = matches;
                bestIndex = index;
            }
        }

        String selected = bestIndex >= 0 ? parts[bestIndex] : content;
        if (bestIndex >= 0 && bestIndex + 1 < parts.length && selected.length() < 260) {
            selected = selected + " " + parts[bestIndex + 1];
        }
        String clean = selected.replaceAll("\\s+", " ").trim();
        return clean.length() > SNIPPET_LENGTH
                ? clean.substring(0, SNIPPET_LENGTH).trim() + "…"
                : clean;
    }

    private DtoRespuestaAsistente.Fuente toSource(ScoredDocument scored) {
        DtoRespuestaAsistente.Fuente source = new DtoRespuestaAsistente.Fuente();
        source.setId(scored.document().getId());
        source.setName(scored.document().getName());
        source.setCategory(scored.document().getCategory());
        source.setSnippet(scored.snippet());
        source.setScore(scored.score());
        return source;
    }

    private DtoFuenteConocimiento toDto(DocumentoConocimiento document) {
        DtoFuenteConocimiento dto = new DtoFuenteConocimiento();
        dto.setId(document.getId());
        dto.setName(document.getName());
        dto.setCategory(document.getCategory());
        dto.setCharacters(document.getContent() == null ? 0 : document.getContent().length());
        dto.setUpdatedAt(document.getUpdatedAt());
        return dto;
    }

    private Set<String> extractTerms(String normalizedQuestion) {
        if (normalizedQuestion.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(normalizedQuestion.split("[^a-z0-9ñ]+"))
                .filter(word -> word.length() > 2 && !STOP_WORDS.contains(word))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    /**
     * Detecta saludos y solicitudes de orientación para responderlos localmente,
     * sin gastar una llamada a GPT ni devolver un mensaje de "no encontrado".
     */
    private boolean isConversationalIntent(String normalizedQuestion) {
        if (normalizedQuestion.isBlank()) {
            return false;
        }
        List<String> words = Arrays.stream(normalizedQuestion.split("[^a-z0-9ñ]+"))
                .filter(word -> !word.isBlank())
                .collect(Collectors.toList());
        return !words.isEmpty() && words.stream().allMatch(CONVERSATIONAL_WORDS::contains);
    }

    private int countMatches(String haystack, String needle) {
        int count = 0;
        int index = haystack.indexOf(needle);
        while (index != -1) {
            count++;
            index = haystack.indexOf(needle, index + needle.length());
        }
        return count;
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return Normalizer.normalize(value.toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
    }

    private record ScoredDocument(DocumentoConocimiento document, int score, String snippet) {
    }
}
