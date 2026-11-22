import api from './api';
import type { ApiResponse } from './healthService';

export interface TeacherDto {
  id?: number;
  code: string;
  firstName: string;
  lastName: string;
  documentId?: string;
  email?: string;
  phone?: string;
  academicDegree?: string;
  professionalTitle?: string;
  category: string;
  dedication: string;
  faculty?: string;
  department?: string;
  mainSpecialty?: string;
  birthDate?: string;
  hireDate?: string;
  address?: string;
  avatar?: string;
  fullName?: string;
  userId?: number | null;
  specialtyCount?: number;
  assignmentCount?: number;
  weeklyLoad?: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherSpecialtyDto {
  id?: number;
  teacherId?: number;
  teacherName?: string;
  name: string;
  area?: string;
  level: string;
  institution?: string;
  year?: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherAssignmentDto {
  id?: number;
  teacherId?: number;
  teacherName?: string;
  period: string;
  course: string;
  courseCode?: string;
  section?: string;
  credits?: number;
  theoryHours?: number;
  practiceHours?: number;
  totalHours?: number;
  status: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const teacherService = {
  async getTeachers(): Promise<ApiResponse<TeacherDto[]>> {
    const response = await api.get<ApiResponse<TeacherDto[]>>('/v1/teachers');
    return response.data;
  },

  async getActiveTeachers(): Promise<ApiResponse<TeacherDto[]>> {
    const response = await api.get<ApiResponse<TeacherDto[]>>('/v1/teachers/active');
    return response.data;
  },

  async createTeacher(payload: TeacherDto): Promise<ApiResponse<TeacherDto>> {
    const response = await api.post<ApiResponse<TeacherDto>>('/v1/teachers', payload);
    return response.data;
  },

  async updateTeacher(id: number, payload: TeacherDto): Promise<ApiResponse<TeacherDto>> {
    const response = await api.put<ApiResponse<TeacherDto>>(`/v1/teachers/${id}`, payload);
    return response.data;
  },

  async toggleTeacherStatus(id: number, active: boolean): Promise<ApiResponse<void>> {
    const response = await api.patch<ApiResponse<void>>(`/v1/teachers/${id}/status`, null, {
      params: { active },
    });
    return response.data;
  },

  async deleteTeacher(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/v1/teachers/${id}`);
    return response.data;
  },

  async getSpecialties(teacherId: number): Promise<ApiResponse<TeacherSpecialtyDto[]>> {
    const response = await api.get<ApiResponse<TeacherSpecialtyDto[]>>(`/v1/teacher-specialties/teacher/${teacherId}`);
    return response.data;
  },

  async createSpecialty(teacherId: number, payload: TeacherSpecialtyDto): Promise<ApiResponse<TeacherSpecialtyDto>> {
    const response = await api.post<ApiResponse<TeacherSpecialtyDto>>(`/v1/teacher-specialties/teacher/${teacherId}`, payload);
    return response.data;
  },

  async updateSpecialty(id: number, payload: TeacherSpecialtyDto): Promise<ApiResponse<TeacherSpecialtyDto>> {
    const response = await api.put<ApiResponse<TeacherSpecialtyDto>>(`/v1/teacher-specialties/${id}`, payload);
    return response.data;
  },

  async deleteSpecialty(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/v1/teacher-specialties/${id}`);
    return response.data;
  },

  async getAssignments(teacherId: number): Promise<ApiResponse<TeacherAssignmentDto[]>> {
    const response = await api.get<ApiResponse<TeacherAssignmentDto[]>>(`/v1/teacher-assignments/teacher/${teacherId}`);
    return response.data;
  },

  async createAssignment(teacherId: number, payload: TeacherAssignmentDto): Promise<ApiResponse<TeacherAssignmentDto>> {
    const response = await api.post<ApiResponse<TeacherAssignmentDto>>(`/v1/teacher-assignments/teacher/${teacherId}`, payload);
    return response.data;
  },

  async updateAssignment(id: number, payload: TeacherAssignmentDto): Promise<ApiResponse<TeacherAssignmentDto>> {
    const response = await api.put<ApiResponse<TeacherAssignmentDto>>(`/v1/teacher-assignments/${id}`, payload);
    return response.data;
  },

  async deleteAssignment(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/v1/teacher-assignments/${id}`);
    return response.data;
  },
};
