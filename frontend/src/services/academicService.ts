import api from './api';
import type { ApiResponse } from './healthService';

export interface AcademicPeriodDto {
  id?: number;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  enrollmentStart?: string;
  enrollmentEnd?: string;
  current?: boolean;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseDto {
  id?: number;
  code: string;
  name: string;
  credits: number;
  theoryHours: number;
  practiceHours: number;
  totalHours?: number;
  type: string;
  description?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudyPlanDto {
  id?: number;
  careerId: number;
  careerName?: string;
  code: string;
  name: string;
  year: number;
  description?: string;
  courseCount?: number;
  totalCredits?: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlanCourseDto {
  id?: number;
  planId?: number;
  courseId: number;
  courseCode?: string;
  courseName?: string;
  credits?: number;
  cycle: number;
  mandatory?: boolean;
  active?: boolean;
}

export interface SectionDto {
  id?: number;
  periodId: number;
  periodCode?: string;
  courseId: number;
  courseCode?: string;
  courseName?: string;
  credits?: number;
  teacherId?: number;
  teacherName?: string;
  code: string;
  capacity: number;
  enrolledCount?: number;
  available?: number;
  shift?: string;
  classroom?: string;
  schedule?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EnrollmentDto {
  id?: number;
  studentId: number;
  studentCode?: string;
  studentName?: string;
  sectionId: number;
  sectionCode?: string;
  courseId?: number;
  courseCode?: string;
  courseName?: string;
  periodId?: number;
  periodCode?: string;
  credits?: number;
  enrollmentDate?: string;
  status?: string;
  observation?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PrerequisiteDto {
  id?: number;
  courseId?: number;
  prerequisiteId: number;
  prerequisiteCode?: string;
  prerequisiteName?: string;
  credits?: number;
  active?: boolean;
}

export interface ScheduleDto {
  id?: number;
  sectionId?: number;
  day: string;
  startTime: string;
  endTime: string;
  classroom?: string;
  active?: boolean;
}

export const academicService = {
  async getPeriods(): Promise<ApiResponse<AcademicPeriodDto[]>> {
    const response = await api.get<ApiResponse<AcademicPeriodDto[]>>('/v1/academic-periods');
    return response.data;
  },

  async createPeriod(payload: AcademicPeriodDto): Promise<ApiResponse<AcademicPeriodDto>> {
    const response = await api.post<ApiResponse<AcademicPeriodDto>>('/v1/academic-periods', payload);
    return response.data;
  },

  async updatePeriod(id: number, payload: AcademicPeriodDto): Promise<ApiResponse<AcademicPeriodDto>> {
    const response = await api.put<ApiResponse<AcademicPeriodDto>>(`/v1/academic-periods/${id}`, payload);
    return response.data;
  },

  async activatePeriod(id: number): Promise<ApiResponse<AcademicPeriodDto>> {
    const response = await api.patch<ApiResponse<AcademicPeriodDto>>(`/v1/academic-periods/${id}/activate`);
    return response.data;
  },

  async deletePeriod(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/v1/academic-periods/${id}`);
    return response.data;
  },

  async getCourses(): Promise<ApiResponse<CourseDto[]>> {
    const response = await api.get<ApiResponse<CourseDto[]>>('/v1/courses');
    return response.data;
  },

  async createCourse(payload: CourseDto): Promise<ApiResponse<CourseDto>> {
    const response = await api.post<ApiResponse<CourseDto>>('/v1/courses', payload);
    return response.data;
  },

  async updateCourse(id: number, payload: CourseDto): Promise<ApiResponse<CourseDto>> {
    const response = await api.put<ApiResponse<CourseDto>>(`/v1/courses/${id}`, payload);
    return response.data;
  },

  async deleteCourse(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/v1/courses/${id}`);
    return response.data;
  },

  async getPlans(): Promise<ApiResponse<StudyPlanDto[]>> {
    const response = await api.get<ApiResponse<StudyPlanDto[]>>('/v1/study-plans');
    return response.data;
  },

  async getPlanCourses(planId: number): Promise<ApiResponse<PlanCourseDto[]>> {
    const response = await api.get<ApiResponse<PlanCourseDto[]>>(`/v1/study-plans/${planId}/courses`);
    return response.data;
  },

  async createPlan(payload: StudyPlanDto): Promise<ApiResponse<StudyPlanDto>> {
    const response = await api.post<ApiResponse<StudyPlanDto>>('/v1/study-plans', payload);
    return response.data;
  },

  async updatePlan(id: number, payload: StudyPlanDto): Promise<ApiResponse<StudyPlanDto>> {
    const response = await api.put<ApiResponse<StudyPlanDto>>(`/v1/study-plans/${id}`, payload);
    return response.data;
  },

  async deletePlan(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/v1/study-plans/${id}`);
    return response.data;
  },

  async addPlanCourse(planId: number, payload: PlanCourseDto): Promise<ApiResponse<PlanCourseDto>> {
    const response = await api.post<ApiResponse<PlanCourseDto>>(`/v1/study-plans/${planId}/courses`, payload);
    return response.data;
  },

  async removePlanCourse(planId: number, planCourseId: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/v1/study-plans/${planId}/courses/${planCourseId}`);
    return response.data;
  },

  async getSections(): Promise<ApiResponse<SectionDto[]>> {
    const response = await api.get<ApiResponse<SectionDto[]>>('/v1/sections');
    return response.data;
  },

  async createSection(payload: SectionDto): Promise<ApiResponse<SectionDto>> {
    const response = await api.post<ApiResponse<SectionDto>>('/v1/sections', payload);
    return response.data;
  },

  async updateSection(id: number, payload: SectionDto): Promise<ApiResponse<SectionDto>> {
    const response = await api.put<ApiResponse<SectionDto>>(`/v1/sections/${id}`, payload);
    return response.data;
  },

  async deleteSection(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/v1/sections/${id}`);
    return response.data;
  },

  async getEnrollments(): Promise<ApiResponse<EnrollmentDto[]>> {
    const response = await api.get<ApiResponse<EnrollmentDto[]>>('/v1/enrollments');
    return response.data;
  },

  async createEnrollment(payload: EnrollmentDto): Promise<ApiResponse<EnrollmentDto>> {
    const response = await api.post<ApiResponse<EnrollmentDto>>('/v1/enrollments', payload);
    return response.data;
  },

  async updateEnrollmentStatus(id: number, status: string): Promise<ApiResponse<EnrollmentDto>> {
    const response = await api.patch<ApiResponse<EnrollmentDto>>(`/v1/enrollments/${id}/status`, null, {
      params: { status },
    });
    return response.data;
  },

  async deleteEnrollment(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/v1/enrollments/${id}`);
    return response.data;
  },

  async getPrerequisites(courseId: number): Promise<ApiResponse<PrerequisiteDto[]>> {
    const response = await api.get<ApiResponse<PrerequisiteDto[]>>(`/v1/courses/${courseId}/prerequisites`);
    return response.data;
  },

  async addPrerequisite(courseId: number, prerequisiteId: number): Promise<ApiResponse<PrerequisiteDto>> {
    const response = await api.post<ApiResponse<PrerequisiteDto>>(`/v1/courses/${courseId}/prerequisites`, {
      prerequisiteId,
    });
    return response.data;
  },

  async removePrerequisite(courseId: number, prerequisiteId: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/v1/courses/${courseId}/prerequisites/${prerequisiteId}`);
    return response.data;
  },

  async getSchedules(sectionId: number): Promise<ApiResponse<ScheduleDto[]>> {
    const response = await api.get<ApiResponse<ScheduleDto[]>>(`/v1/sections/${sectionId}/schedules`);
    return response.data;
  },

  async addSchedule(sectionId: number, payload: ScheduleDto): Promise<ApiResponse<ScheduleDto>> {
    const response = await api.post<ApiResponse<ScheduleDto>>(`/v1/sections/${sectionId}/schedules`, payload);
    return response.data;
  },

  async removeSchedule(sectionId: number, scheduleId: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/v1/sections/${sectionId}/schedules/${scheduleId}`);
    return response.data;
  },
};
