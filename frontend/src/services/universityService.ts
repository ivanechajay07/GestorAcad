import api from './api';
import type { ApiResponse } from './healthService';

export interface UniversityDto {
  id?: number;
  name: string;
  shortName?: string;
  motto?: string;
  institutionType: string;
  taxId?: string;
  licensingResolution?: string;
  licensingStatus?: string;
  accreditationValidity?: string;
  foundationDate?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CampusDto {
  id?: number;
  universityId?: number;
  universityName?: string;
  name: string;
  code: string;
  campusType: string;
  address?: string;
  district?: string;
  city?: string;
  region?: string;
  phone?: string;
  email?: string;
  capacity?: number;
  pavilions?: number;
  laboratories?: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthorityDto {
  id?: number;
  universityId?: number;
  universityName?: string;
  position: string;
  firstName: string;
  lastName: string;
  academicDegree?: string;
  documentNumber?: string;
  email?: string;
  phone?: string;
  office?: string;
  periodStart?: string;
  periodEnd?: string;
  appointmentResolution?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FacultyDto {
  id?: number;
  name: string;
  description?: string;
  careerCount?: number;
  studentCount?: number;
  teacherCount?: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CareerDto {
  id?: number;
  facultyId: number;
  facultyName?: string;
  name: string;
  description?: string;
  studentCount?: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemParameterDto {
  id?: number;
  key: string;
  value: string;
  valueType: string;
  module: string;
  description?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const universityService = {
  async getActiveUniversity(): Promise<ApiResponse<UniversityDto>> {
    const response = await api.get<ApiResponse<UniversityDto>>('/v1/university/active');
    return response.data;
  },

  async getAllUniversities(): Promise<ApiResponse<UniversityDto[]>> {
    const response = await api.get<ApiResponse<UniversityDto[]>>('/v1/university');
    return response.data;
  },

  async updateUniversity(id: number, payload: UniversityDto): Promise<ApiResponse<UniversityDto>> {
    const response = await api.put<ApiResponse<UniversityDto>>(`/v1/university/${id}`, payload);
    return response.data;
  },

  async createUniversity(payload: UniversityDto): Promise<ApiResponse<UniversityDto>> {
    const response = await api.post<ApiResponse<UniversityDto>>('/v1/university', payload);
    return response.data;
  },

  async getCampuses(): Promise<ApiResponse<CampusDto[]>> {
    const response = await api.get<ApiResponse<CampusDto[]>>('/v1/campuses');
    return response.data;
  },

  async createCampus(payload: CampusDto): Promise<ApiResponse<CampusDto>> {
    const response = await api.post<ApiResponse<CampusDto>>('/v1/campuses', payload);
    return response.data;
  },

  async updateCampus(id: number, payload: CampusDto): Promise<ApiResponse<CampusDto>> {
    const response = await api.put<ApiResponse<CampusDto>>(`/v1/campuses/${id}`, payload);
    return response.data;
  },

  async deleteCampus(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/v1/campuses/${id}`);
    return response.data;
  },

  async getAuthorities(): Promise<ApiResponse<AuthorityDto[]>> {
    const response = await api.get<ApiResponse<AuthorityDto[]>>('/v1/authorities');
    return response.data;
  },

  async createAuthority(payload: AuthorityDto): Promise<ApiResponse<AuthorityDto>> {
    const response = await api.post<ApiResponse<AuthorityDto>>('/v1/authorities', payload);
    return response.data;
  },

  async updateAuthority(id: number, payload: AuthorityDto): Promise<ApiResponse<AuthorityDto>> {
    const response = await api.put<ApiResponse<AuthorityDto>>(`/v1/authorities/${id}`, payload);
    return response.data;
  },

  async deleteAuthority(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/v1/authorities/${id}`);
    return response.data;
  },

  async getParameters(): Promise<ApiResponse<SystemParameterDto[]>> {
    const response = await api.get<ApiResponse<SystemParameterDto[]>>('/v1/parameters');
    return response.data;
  },

  async createParameter(payload: SystemParameterDto): Promise<ApiResponse<SystemParameterDto>> {
    const response = await api.post<ApiResponse<SystemParameterDto>>('/v1/parameters', payload);
    return response.data;
  },

  async updateParameter(id: number, payload: SystemParameterDto): Promise<ApiResponse<SystemParameterDto>> {
    const response = await api.put<ApiResponse<SystemParameterDto>>(`/v1/parameters/${id}`, payload);
    return response.data;
  },

  async deleteParameter(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/v1/parameters/${id}`);
    return response.data;
  },

  async getFaculties(): Promise<ApiResponse<FacultyDto[]>> {
    const response = await api.get<ApiResponse<FacultyDto[]>>('/v1/faculties');
    return response.data;
  },

  async createFaculty(payload: FacultyDto): Promise<ApiResponse<FacultyDto>> {
    const response = await api.post<ApiResponse<FacultyDto>>('/v1/faculties', payload);
    return response.data;
  },

  async updateFaculty(id: number, payload: FacultyDto): Promise<ApiResponse<FacultyDto>> {
    const response = await api.put<ApiResponse<FacultyDto>>(`/v1/faculties/${id}`, payload);
    return response.data;
  },

  async deleteFaculty(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/v1/faculties/${id}`);
    return response.data;
  },

  async getCareers(): Promise<ApiResponse<CareerDto[]>> {
    const response = await api.get<ApiResponse<CareerDto[]>>('/v1/careers');
    return response.data;
  },

  async getCareersByFaculty(facultyId: number): Promise<ApiResponse<CareerDto[]>> {
    const response = await api.get<ApiResponse<CareerDto[]>>(`/v1/careers/faculty/${facultyId}`);
    return response.data;
  },

  async createCareer(payload: CareerDto): Promise<ApiResponse<CareerDto>> {
    const response = await api.post<ApiResponse<CareerDto>>('/v1/careers', payload);
    return response.data;
  },

  async updateCareer(id: number, payload: CareerDto): Promise<ApiResponse<CareerDto>> {
    const response = await api.put<ApiResponse<CareerDto>>(`/v1/careers/${id}`, payload);
    return response.data;
  },

  async deleteCareer(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/v1/careers/${id}`);
    return response.data;
  },
};
