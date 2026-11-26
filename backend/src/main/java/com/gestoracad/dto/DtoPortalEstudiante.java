package com.gestoracad.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Resumen del portal del estudiante.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoPortalEstudiante {

    private String code;
    private String firstName;
    private String lastName;
    private String career;
    private String faculty;
    private Integer currentCycle;
    private Integer approvedCredits;
    private BigDecimal weightedAverage;
    private String condition;
    private BigDecimal minimumGrade;
    private Plan plan;
    private List<Curso> courses = new ArrayList<>();

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getCareer() { return career; }
    public void setCareer(String career) { this.career = career; }
    public String getFaculty() { return faculty; }
    public void setFaculty(String faculty) { this.faculty = faculty; }
    public Integer getCurrentCycle() { return currentCycle; }
    public void setCurrentCycle(Integer currentCycle) { this.currentCycle = currentCycle; }
    public Integer getApprovedCredits() { return approvedCredits; }
    public void setApprovedCredits(Integer approvedCredits) { this.approvedCredits = approvedCredits; }
    public BigDecimal getWeightedAverage() { return weightedAverage; }
    public void setWeightedAverage(BigDecimal weightedAverage) { this.weightedAverage = weightedAverage; }
    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }
    public BigDecimal getMinimumGrade() { return minimumGrade; }
    public void setMinimumGrade(BigDecimal minimumGrade) { this.minimumGrade = minimumGrade; }
    public Plan getPlan() { return plan; }
    public void setPlan(Plan plan) { this.plan = plan; }
    public List<Curso> getCourses() { return courses; }
    public void setCourses(List<Curso> courses) { this.courses = courses; }

    public static class Curso {
        private String periodCode;
        private String courseCode;
        private String courseName;
        private String sectionCode;
        private Long sectionId;
        private String teacherName;
        private String schedule;
        private String classroom;
        private List<Horario> scheduleBlocks = new ArrayList<>();
        private LocalDate enrollmentDate;
        private int credits;
        private String status;
        private String actaStatus;
        private BigDecimal average;
        private Boolean approved;
        private long present;
        private long absent;
        private long late;
        private List<Nota> grades = new ArrayList<>();

        public String getPeriodCode() { return periodCode; }
        public void setPeriodCode(String periodCode) { this.periodCode = periodCode; }
        public String getCourseCode() { return courseCode; }
        public void setCourseCode(String courseCode) { this.courseCode = courseCode; }
        public String getCourseName() { return courseName; }
        public void setCourseName(String courseName) { this.courseName = courseName; }
        public String getSectionCode() { return sectionCode; }
        public void setSectionCode(String sectionCode) { this.sectionCode = sectionCode; }
        public Long getSectionId() { return sectionId; }
        public void setSectionId(Long sectionId) { this.sectionId = sectionId; }
        public String getTeacherName() { return teacherName; }
        public void setTeacherName(String teacherName) { this.teacherName = teacherName; }
        public String getSchedule() { return schedule; }
        public void setSchedule(String schedule) { this.schedule = schedule; }
        public String getClassroom() { return classroom; }
        public void setClassroom(String classroom) { this.classroom = classroom; }
        public List<Horario> getScheduleBlocks() { return scheduleBlocks; }
        public void setScheduleBlocks(List<Horario> scheduleBlocks) { this.scheduleBlocks = scheduleBlocks; }
        public LocalDate getEnrollmentDate() { return enrollmentDate; }
        public void setEnrollmentDate(LocalDate enrollmentDate) { this.enrollmentDate = enrollmentDate; }
        public int getCredits() { return credits; }
        public void setCredits(int credits) { this.credits = credits; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getActaStatus() { return actaStatus; }
        public void setActaStatus(String actaStatus) { this.actaStatus = actaStatus; }
        public BigDecimal getAverage() { return average; }
        public void setAverage(BigDecimal average) { this.average = average; }
        public Boolean getApproved() { return approved; }
        public void setApproved(Boolean approved) { this.approved = approved; }
        public long getPresent() { return present; }
        public void setPresent(long present) { this.present = present; }
        public long getAbsent() { return absent; }
        public void setAbsent(long absent) { this.absent = absent; }
        public long getLate() { return late; }
        public void setLate(long late) { this.late = late; }
        public List<Nota> getGrades() { return grades; }
        public void setGrades(List<Nota> grades) { this.grades = grades; }
    }

    public static class Nota {
        private String evaluationName;
        private String type;
        private BigDecimal weight;
        private BigDecimal score;
        private BigDecimal maxScore;
        private LocalDate date;

        public String getEvaluationName() { return evaluationName; }
        public void setEvaluationName(String evaluationName) { this.evaluationName = evaluationName; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public BigDecimal getWeight() { return weight; }
        public void setWeight(BigDecimal weight) { this.weight = weight; }
        public BigDecimal getScore() { return score; }
        public void setScore(BigDecimal score) { this.score = score; }
        public BigDecimal getMaxScore() { return maxScore; }
        public void setMaxScore(BigDecimal maxScore) { this.maxScore = maxScore; }
        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
    }

    public static class Horario {
        private String day;
        private String startTime;
        private String endTime;
        private String classroom;

        public String getDay() { return day; }
        public void setDay(String day) { this.day = day; }
        public String getStartTime() { return startTime; }
        public void setStartTime(String startTime) { this.startTime = startTime; }
        public String getEndTime() { return endTime; }
        public void setEndTime(String endTime) { this.endTime = endTime; }
        public String getClassroom() { return classroom; }
        public void setClassroom(String classroom) { this.classroom = classroom; }
    }

    public static class Plan {
        private String code;
        private String name;
        private int totalCredits;
        private int approvedCredits;
        private int progressPercent;
        private List<PlanCourse> courses = new ArrayList<>();

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public int getTotalCredits() { return totalCredits; }
        public void setTotalCredits(int totalCredits) { this.totalCredits = totalCredits; }
        public int getApprovedCredits() { return approvedCredits; }
        public void setApprovedCredits(int approvedCredits) { this.approvedCredits = approvedCredits; }
        public int getProgressPercent() { return progressPercent; }
        public void setProgressPercent(int progressPercent) { this.progressPercent = progressPercent; }
        public List<PlanCourse> getCourses() { return courses; }
        public void setCourses(List<PlanCourse> courses) { this.courses = courses; }
    }

    public static class PlanCourse {
        private String courseCode;
        private String courseName;
        private int cycle;
        private int credits;
        private boolean mandatory;
        private String status;

        public String getCourseCode() { return courseCode; }
        public void setCourseCode(String courseCode) { this.courseCode = courseCode; }
        public String getCourseName() { return courseName; }
        public void setCourseName(String courseName) { this.courseName = courseName; }
        public int getCycle() { return cycle; }
        public void setCycle(int cycle) { this.cycle = cycle; }
        public int getCredits() { return credits; }
        public void setCredits(int credits) { this.credits = credits; }
        public boolean isMandatory() { return mandatory; }
        public void setMandatory(boolean mandatory) { this.mandatory = mandatory; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
