import api from './api';
import type { ApiResponse } from './healthService';

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  department?: string;
  avatar?: string;
  active: boolean;
  accountLocked: boolean;
  createdAt: string;
  lastSeen?: string;
  roles: string[];
  permissions: string[];
}

export interface UserCreatePayload {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  department?: string;
  avatar?: string;
  roles: string[];
}

export interface UserUpdatePayload {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: string;
  roles: string[];
  avatar?: string;
  newPassword?: string;
}

export const userService = {
  async getAllUsers(): Promise<ApiResponse<UserResponse[]>> {
    const response = await api.get<ApiResponse<UserResponse[]>>('/v1/users');
    return response.data;
  },

  async getUserById(id: number): Promise<ApiResponse<UserResponse>> {
    const response = await api.get<ApiResponse<UserResponse>>(`/v1/users/${id}`);
    return response.data;
  },

  async createUser(payload: UserCreatePayload): Promise<ApiResponse<UserResponse>> {
    const response = await api.post<ApiResponse<UserResponse>>('/v1/users', payload);
    return response.data;
  },

  async updateUser(id: number, payload: UserUpdatePayload): Promise<ApiResponse<UserResponse>> {
    const response = await api.put<ApiResponse<UserResponse>>(`/v1/users/${id}`, payload);
    return response.data;
  },

  async toggleStatus(id: number, active: boolean): Promise<ApiResponse<void>> {
    const response = await api.patch<ApiResponse<void>>(`/v1/users/${id}/status?active=${active}`);
    return response.data;
  },
};
