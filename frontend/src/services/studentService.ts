import api from './api';
import type { ApiResponse } from './healthService';

export interface StudentDto {
  id?: number;
  code: string;
  firstName: string;
  lastName: string;
  documentId?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  career?: string;
  faculty?: string;
  currentCycle?: number;
  approvedCredits?: number;
  weightedAverage?: number;
  condition: string;
  enrollmentStatus: string;
  entryPeriod?: string;
  admissionModality?: string;
  highSchool?: string;
  fullName?: string;
  userId?: number | null;
  admissionCount?: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentAdmissionDto {
  id?: number;
  studentId?: number;
  studentName?: string;
  modality: string;
  period: string;
  highSchool?: string;
  score?: number;
  admissionDate?: string;
  status: string;
  observation?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const studentService = {
  async getStudents(): Promise<ApiResponse<StudentDto[]>> {
    const response = await api.get<ApiResponse<StudentDto[]>>('/v1/students');
    return response.data;
  },

  async getActiveStudents(): Promise<ApiResponse<StudentDto[]>> {
    const response = await api.get<ApiResponse<StudentDto[]>>('/v1/students/active');
    return response.data;
  },

  async createStudent(payload: StudentDto): Promise<ApiResponse<StudentDto>> {
    const response = await api.post<ApiResponse<StudentDto>>('/v1/students', payload);
    return response.data;
  },

  async updateStudent(id: number, payload: StudentDto): Promise<ApiResponse<StudentDto>> {
    const response = await api.put<ApiResponse<StudentDto>>(`/v1/students/${id}`, payload);
    return response.data;
  },

  async toggleStudentStatus(id: number, active: boolean): Promise<ApiResponse<void>> {
    const response = await api.patch<ApiResponse<void>>(`/v1/students/${id}/status`, null, {
      params: { active },
    });
    return response.data;
  },

  async deleteStudent(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/v1/students/${id}`);
    return response.data;
  },

  async getAdmissions(studentId: number): Promise<ApiResponse<StudentAdmissionDto[]>> {
    const response = await api.get<ApiResponse<StudentAdmissionDto[]>>(`/v1/student-admissions/student/${studentId}`);
    return response.data;
  },

  async createAdmission(studentId: number, payload: StudentAdmissionDto): Promise<ApiResponse<StudentAdmissionDto>> {
    const response = await api.post<ApiResponse<StudentAdmissionDto>>(`/v1/student-admissions/student/${studentId}`, payload);
    return response.data;
  },

  async updateAdmission(id: number, payload: StudentAdmissionDto): Promise<ApiResponse<StudentAdmissionDto>> {
    const response = await api.put<ApiResponse<StudentAdmissionDto>>(`/v1/student-admissions/${id}`, payload);
    return response.data;
  },

  async deleteAdmission(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/v1/student-admissions/${id}`);
    return response.data;
  },
};
