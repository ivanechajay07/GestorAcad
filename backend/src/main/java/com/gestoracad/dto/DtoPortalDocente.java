package com.gestoracad.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Resumen del portal del docente.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoPortalDocente {

    private String code;
    private String name;
    private String faculty;
    private List<Seccion> sections = new ArrayList<>();

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getFaculty() { return faculty; }
    public void setFaculty(String faculty) { this.faculty = faculty; }
    public List<Seccion> getSections() { return sections; }
    public void setSections(List<Seccion> sections) { this.sections = sections; }

    public static class Seccion {
        private Long id;
        private String periodCode;
        private String courseCode;
        private String courseName;
        private String sectionCode;
        private long students;
        private long evaluations;
        private String actaStatus;
        private String schedule;

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
        public long getStudents() { return students; }
        public void setStudents(long students) { this.students = students; }
        public long getEvaluations() { return evaluations; }
        public void setEvaluations(long evaluations) { this.evaluations = evaluations; }
        public String getActaStatus() { return actaStatus; }
        public void setActaStatus(String actaStatus) { this.actaStatus = actaStatus; }
        public String getSchedule() { return schedule; }
        public void setSchedule(String schedule) { this.schedule = schedule; }
    }
}
