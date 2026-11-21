package com.gestoracad.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Respuesta extractiva del asistente local con las fuentes utilizadas.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoRespuestaAsistente {

    private String answer;
    private String mode = "LOCAL";
    private boolean greeting;
    private List<Fuente> sources = new ArrayList<>();

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
    public boolean isGreeting() { return greeting; }
    public void setGreeting(boolean greeting) { this.greeting = greeting; }
    public List<Fuente> getSources() { return sources; }
    public void setSources(List<Fuente> sources) { this.sources = sources; }

    public static class Fuente {
        private Long id;
        private String name;
        private String category;
        private String snippet;
        private int score;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public String getSnippet() { return snippet; }
        public void setSnippet(String snippet) { this.snippet = snippet; }
        public int getScore() { return score; }
        public void setScore(int score) { this.score = score; }
    }
}
