import api from './api';
import type { ApiResponse } from './healthService';

export interface EvaluationDto {
  id?: number;
  sectionId: number;
  name: string;
  type: string;
  weight: number;
  date?: string;
  maxScore: number;
  active?: boolean;
}

export interface GradeDto {
  id?: number;
  evaluationId?: number;
  studentId: number;
  studentCode?: string;
  studentName?: string;
  score?: number | null;
  observation?: string;
  active?: boolean;
}

export interface AttendanceDto {
  id?: number;
  sectionId?: number;
  studentId: number;
  studentCode?: string;
  studentName?: string;
  date?: string;
  status: string;
  observation?: string;
  active?: boolean;
}

export interface ActaDetailDto {
  studentId: number;
  studentCode: string;
  studentName: string;
  average: number;
  approved: boolean;
  credits: number;
}

export interface ActaDto {
  id?: number;
  sectionId: number;
  sectionCode?: string;
  courseCode?: string;
  courseName?: string;
  status: string;
  closedAt?: string;
  closedBy?: string;
  details: ActaDetailDto[];
}

export const evaluationService = {
  async getEvaluations(sectionId: number): Promise<ApiResponse<EvaluationDto[]>> {
    const response = await api.get<ApiResponse<EvaluationDto[]>>(`/v1/sections/${sectionId}/evaluations`);
    return response.data;
  },

  async createEvaluation(sectionId: number, payload: EvaluationDto): Promise<ApiResponse<EvaluationDto>> {
    const response = await api.post<ApiResponse<EvaluationDto>>(`/v1/sections/${sectionId}/evaluations`, payload);
    return response.data;
  },

  async updateEvaluation(id: number, payload: EvaluationDto): Promise<ApiResponse<EvaluationDto>> {
    const response = await api.put<ApiResponse<EvaluationDto>>(`/v1/evaluations/${id}`, payload);
    return response.data;
  },

  async deleteEvaluation(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/v1/evaluations/${id}`);
    return response.data;
  },

  async getGrades(evaluationId: number): Promise<ApiResponse<GradeDto[]>> {
    const response = await api.get<ApiResponse<GradeDto[]>>(`/v1/evaluations/${evaluationId}/grades`);
    return response.data;
  },

  async saveGrades(evaluationId: number, grades: GradeDto[]): Promise<ApiResponse<void>> {
    const response = await api.put<ApiResponse<void>>(`/v1/evaluations/${evaluationId}/grades`, grades);
    return response.data;
  },

  async getAttendance(sectionId: number, date: string): Promise<ApiResponse<AttendanceDto[]>> {
    const response = await api.get<ApiResponse<AttendanceDto[]>>(`/v1/sections/${sectionId}/attendance`, {
      params: { date },
    });
    return response.data;
  },

  async saveAttendance(sectionId: number, date: string, attendance: AttendanceDto[]): Promise<ApiResponse<void>> {
    const response = await api.put<ApiResponse<void>>(`/v1/sections/${sectionId}/attendance`, attendance, {
      params: { date },
    });
    return response.data;
  },

  async getActa(sectionId: number): Promise<ApiResponse<ActaDto>> {
    const response = await api.get<ApiResponse<ActaDto>>(`/v1/sections/${sectionId}/act`);
    return response.data;
  },

  async closeActa(sectionId: number): Promise<ApiResponse<ActaDto>> {
    const response = await api.post<ApiResponse<ActaDto>>(`/v1/sections/${sectionId}/act/close`);
    return response.data;
  },
};
