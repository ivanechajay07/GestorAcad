package com.gestoracad.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Detalle de una sección para el portal del docente.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoSeccionDocente {

    private Long id;
    private String periodCode;
    private String courseCode;
    private String courseName;
    private String sectionCode;
    private String schedule;
    private List<Alumno> students = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPeriodCode() { return periodCode; }
    public void setPeriodCode(String periodCode) { this.periodCode = periodCode; }
    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    public String getSectionCode() { return sectionCode; }
    public void setSectionCode(String sectionCode) { this.sectionCode = sectionCode; }
    public String getSchedule() { return schedule; }
    public void setSchedule(String schedule) { this.schedule = schedule; }
    public List<Alumno> getStudents() { return students; }
    public void setStudents(List<Alumno> students) { this.students = students; }

    public static class Alumno {
        private Long id;
        private String code;
        private String name;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }
}
