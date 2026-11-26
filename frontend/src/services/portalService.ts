import api from './api';
import type { ApiResponse } from './healthService';
import type { ActaDto, AttendanceDto, EvaluationDto, GradeDto } from './evaluationService';

export interface PortalAttendanceDto {
  id?: number;
  date: string;
  status: string;
  observation?: string | null;
}

export interface PortalGradeDto {
  evaluationName: string;
  type: string;
  weight: number;
  score: number | null;
  maxScore: number;
  date?: string | null;
}

export interface PortalScheduleBlockDto {
  day: string;
  startTime: string;
  endTime: string;
  classroom?: string | null;
}

export interface PortalPlanCourseDto {
  courseCode: string;
  courseName: string;
  cycle: number;
  credits: number;
  mandatory: boolean;
  status: 'APROBADO' | 'EN_CURSO' | 'PENDIENTE';
}

export interface PortalPlanDto {
  code: string;
  name: string;
  totalCredits: number;
  approvedCredits: number;
  progressPercent: number;
  courses: PortalPlanCourseDto[];
}

export interface PortalCourseDto {
  periodCode: string;
  courseCode: string;
  courseName: string;
  sectionCode: string;
  sectionId: number;
  teacherName?: string | null;
  schedule?: string | null;
  classroom?: string | null;
  scheduleBlocks?: PortalScheduleBlockDto[];
  enrollmentDate?: string | null;
  credits: number;
  status: string;
  actaStatus: string;
  average: number | null;
  approved: boolean | null;
  present: number;
  absent: number;
  late: number;
  grades: PortalGradeDto[];
}

export interface StudentPortalDto {
  code: string;
  firstName: string;
  lastName: string;
  career?: string;
  faculty?: string;
  currentCycle: number;
  approvedCredits: number;
  weightedAverage: number;
  condition: string;
  minimumGrade?: number | null;
  plan?: PortalPlanDto | null;
  courses: PortalCourseDto[];
}

export interface TeacherSectionDto {
  id: number;
  periodCode: string;
  courseCode: string;
  courseName: string;
  sectionCode: string;
  students: number;
  evaluations: number;
  actaStatus: string;
  schedule?: string;
}

export interface TeacherPortalDto {
  code: string;
  name: string;
  faculty?: string;
  sections: TeacherSectionDto[];
}

export interface TeacherSectionDetailDto {
  id: number;
  periodCode: string;
  courseCode: string;
  courseName: string;
  sectionCode: string;
  schedule?: string;
  students: { id: number; code: string; name: string }[];
}

export const portalService = {
  async getStudentSummary(): Promise<ApiResponse<StudentPortalDto>> {
    const response = await api.get<ApiResponse<StudentPortalDto>>('/v1/portal/student/summary');
    return response.data;
  },

  async getStudentHistory(): Promise<ApiResponse<PortalCourseDto[]>> {
    const response = await api.get<ApiResponse<PortalCourseDto[]>>('/v1/portal/student/history');
    return response.data;
  },

  async getStudentAttendance(sectionId: number): Promise<ApiResponse<PortalAttendanceDto[]>> {
    const response = await api.get<ApiResponse<PortalAttendanceDto[]>>(
      `/v1/portal/student/sections/${sectionId}/attendance`
    );
    return response.data;
  },

  async getTeacherSummary(): Promise<ApiResponse<TeacherPortalDto>> {
    const response = await api.get<ApiResponse<TeacherPortalDto>>('/v1/portal/teacher/summary');
    return response.data;
  },

  async getTeacherSection(id: number): Promise<ApiResponse<TeacherSectionDetailDto>> {
    const response = await api.get<ApiResponse<TeacherSectionDetailDto>>(`/v1/portal/teacher/sections/${id}`);
    return response.data;
  },

  async getTeacherEvaluations(sectionId: number): Promise<ApiResponse<EvaluationDto[]>> {
    const response = await api.get<ApiResponse<EvaluationDto[]>>(`/v1/portal/teacher/sections/${sectionId}/evaluations`);
    return response.data;
  },

  async getTeacherGrades(evaluationId: number): Promise<ApiResponse<GradeDto[]>> {
    const response = await api.get<ApiResponse<GradeDto[]>>(`/v1/portal/teacher/evaluations/${evaluationId}/grades`);
    return response.data;
  },

  async saveTeacherGrades(evaluationId: number, grades: GradeDto[]): Promise<ApiResponse<void>> {
    const response = await api.put<ApiResponse<void>>(`/v1/portal/teacher/evaluations/${evaluationId}/grades`, grades);
    return response.data;
  },

  async getTeacherAttendance(sectionId: number, date: string): Promise<ApiResponse<AttendanceDto[]>> {
    const response = await api.get<ApiResponse<AttendanceDto[]>>(`/v1/portal/teacher/sections/${sectionId}/attendance`, {
      params: { date },
    });
    return response.data;
  },

  async saveTeacherAttendance(sectionId: number, date: string, attendance: AttendanceDto[]): Promise<ApiResponse<void>> {
    const response = await api.put<ApiResponse<void>>(`/v1/portal/teacher/sections/${sectionId}/attendance`, attendance, {
      params: { date },
    });
    return response.data;
  },

  async getTeacherActa(sectionId: number): Promise<ApiResponse<ActaDto>> {
    const response = await api.get<ApiResponse<ActaDto>>(`/v1/portal/teacher/sections/${sectionId}/act`);
    return response.data;
  },

  async closeTeacherActa(sectionId: number): Promise<ApiResponse<ActaDto>> {
    const response = await api.post<ApiResponse<ActaDto>>(`/v1/portal/teacher/sections/${sectionId}/act/close`);
    return response.data;
  },
};
