import api from './api';
import type { ApiResponse } from './healthService';

export interface PermissionData {
  id: number;
  name: string;
  module: string;
  description: string;
}

export interface RoleData {
  id: number;
  name: string;
  description: string;
  permissions: PermissionData[];
  /** Usuarios con este rol asignado (calculado por el backend). */
  usuarios: number;
}

export interface RoleRequestPayload {
  name: string;
  description: string;
  permissionIds: number[];
}

export interface PermissionRequestPayload {
  name: string;
  module: string;
  description: string;
}

export const roleService = {
  async getAllRoles(): Promise<ApiResponse<RoleData[]>> {
    const response = await api.get<ApiResponse<RoleData[]>>('/v1/roles');
    return response.data;
  },

  async getAllPermissions(): Promise<ApiResponse<PermissionData[]>> {
    const response = await api.get<ApiResponse<PermissionData[]>>('/v1/roles/permissions');
    return response.data;
  },

  async createRole(payload: RoleRequestPayload): Promise<ApiResponse<RoleData>> {
    const response = await api.post<ApiResponse<RoleData>>('/v1/roles', payload);
    return response.data;
  },

  async updateRole(id: number, payload: RoleRequestPayload): Promise<ApiResponse<RoleData>> {
    const response = await api.put<ApiResponse<RoleData>>(`/v1/roles/${id}`, payload);
    return response.data;
  },

  async deleteRole(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/v1/roles/${id}`);
    return response.data;
  },

  async createPermission(payload: PermissionRequestPayload): Promise<ApiResponse<PermissionData>> {
    const response = await api.post<ApiResponse<PermissionData>>('/v1/roles/permissions', payload);
    return response.data;
  },

  async updatePermission(id: number, payload: PermissionRequestPayload): Promise<ApiResponse<PermissionData>> {
    const response = await api.put<ApiResponse<PermissionData>>(`/v1/roles/permissions/${id}`, payload);
    return response.data;
  },

  async deletePermission(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/v1/roles/permissions/${id}`);
    return response.data;
  },
};
