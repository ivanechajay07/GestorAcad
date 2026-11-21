import api from './api';

export interface SystemHealthData {
  applicationName: string;
  status: string;
  version: string;
  currentPhase: string;
  environment: string;
  timestamp: string;
  components: {
    database?: {
      status: string;
      details: string;
    };
    security?: {
      status: string;
      type: string;
    };
    apiDocs?: {
      status: string;
      endpoint: string;
    };
    [key: string]: unknown;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export const healthService = {
  async getHealth(): Promise<ApiResponse<SystemHealthData>> {
    const response = await api.get<ApiResponse<SystemHealthData>>('/v1/health');
    return response.data;
  },

  async ping(): Promise<ApiResponse<string>> {
    const response = await api.get<ApiResponse<string>>('/v1/health/ping');
    return response.data;
  },
};
