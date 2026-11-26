package com.gestoracad.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Vista previa del acta de una sección antes de su cierre.
 */
public class DtoActaPreview {

    private Long sectionId;
    private String periodCode;
    private String courseCode;
    private String courseName;
    private String sectionCode;
    private BigDecimal minimumGrade;
    private BigDecimal totalWeight;
    private boolean complete;
    private List<Student> students = new ArrayList<>();

    public Long getSectionId() { return sectionId; }
    public void setSectionId(Long sectionId) { this.sectionId = sectionId; }
    public String getPeriodCode() { return periodCode; }
    public void setPeriodCode(String periodCode) { this.periodCode = periodCode; }
    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    public String getSectionCode() { return sectionCode; }
    public void setSectionCode(String sectionCode) { this.sectionCode = sectionCode; }
    public BigDecimal getMinimumGrade() { return minimumGrade; }
    public void setMinimumGrade(BigDecimal minimumGrade) { this.minimumGrade = minimumGrade; }
    public BigDecimal getTotalWeight() { return totalWeight; }
    public void setTotalWeight(BigDecimal totalWeight) { this.totalWeight = totalWeight; }
    public boolean isComplete() { return complete; }
    public void setComplete(boolean complete) { this.complete = complete; }
    public List<Student> getStudents() { return students; }
    public void setStudents(List<Student> students) { this.students = students; }

    public static class Student {
        private Long studentId;
        private String studentCode;
        private String studentName;
        private BigDecimal average;
        private Boolean approved;
        private int credits;
        private int gradedCount;

        public Long getStudentId() { return studentId; }
        public void setStudentId(Long studentId) { this.studentId = studentId; }
        public String getStudentCode() { return studentCode; }
        public void setStudentCode(String studentCode) { this.studentCode = studentCode; }
        public String getStudentName() { return studentName; }
        public void setStudentName(String studentName) { this.studentName = studentName; }
        public BigDecimal getAverage() { return average; }
        public void setAverage(BigDecimal average) { this.average = average; }
        public Boolean getApproved() { return approved; }
        public void setApproved(Boolean approved) { this.approved = approved; }
        public int getCredits() { return credits; }
        public void setCredits(int credits) { this.credits = credits; }
        public int getGradedCount() { return gradedCount; }
        public void setGradedCount(int gradedCount) { this.gradedCount = gradedCount; }
    }
}
