import api from './api';
import type { ApiResponse } from './healthService';

export interface LoginPayload {
  usernameOrEmail: string;
  password: string;
}

export interface AuthUser {
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
  roles: string[];
  permissions: string[];
}

export interface ProfileUpdatePayload {
  firstName: string;
  lastName: string;
  phone?: string;
  department?: string;
  avatar?: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
  user: AuthUser;
  roles: string[];
  permissions: string[];
}

export const authService = {
  async login(payload: LoginPayload): Promise<ApiResponse<LoginResponse>> {
    const response = await api.post<ApiResponse<LoginResponse>>('/v1/auth/login', payload);
    return response.data;
  },

  async logout(refreshToken?: string): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>('/v1/auth/logout', refreshToken ? { refreshToken } : undefined);
    return response.data;
  },

  async refresh(refreshToken: string): Promise<ApiResponse<LoginResponse>> {
    const response = await api.post<ApiResponse<LoginResponse>>('/v1/auth/refresh', { refreshToken });
    return response.data;
  },

  async getProfile(): Promise<ApiResponse<AuthUser>> {
    const response = await api.get<ApiResponse<AuthUser>>('/v1/auth/me');
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>('/v1/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  async updateProfile(payload: ProfileUpdatePayload): Promise<ApiResponse<AuthUser>> {
    const response = await api.put<ApiResponse<AuthUser>>('/v1/auth/profile', payload);
    return response.data;
  },

  async heartbeat(): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>('/v1/auth/heartbeat');
    return response.data;
  },
};
