import api from './api';
import type { ApiResponse } from './healthService';

export interface KnowledgeSourceDto {
  id: number;
  name: string;
  category: string;
  characters: number;
  updatedAt?: string;
}

export interface AssistantSourceDto {
  id: number;
  name: string;
  category: string;
  snippet: string;
  score: number;
}

export interface AssistantAnswerDto {
  answer: string;
  mode: string;
  greeting?: boolean;
  sources: AssistantSourceDto[];
}

export interface AssistantHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantStatusDto {
  mode: string;
  provider: string;
  gptEnabled: boolean;
  model?: string;
}

export interface KnowledgeDocumentPayload {
  name: string;
  category: string;
  content: string;
}

export const knowledgeService = {
  async listSources(): Promise<ApiResponse<KnowledgeSourceDto[]>> {
    const response = await api.get<ApiResponse<KnowledgeSourceDto[]>>('/v1/knowledge/sources');
    return response.data;
  },

  async createSource(payload: KnowledgeDocumentPayload): Promise<ApiResponse<KnowledgeSourceDto>> {
    const response = await api.post<ApiResponse<KnowledgeSourceDto>>('/v1/knowledge/sources', payload);
    return response.data;
  },

  async deleteSource(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/v1/knowledge/sources/${id}`);
    return response.data;
  },

  async ask(question: string): Promise<ApiResponse<AssistantAnswerDto>> {
    const response = await api.post<ApiResponse<AssistantAnswerDto>>('/v1/knowledge/ask', { question });
    return response.data;
  },

  async chat(
    question: string,
    history: AssistantHistoryMessage[] = []
  ): Promise<ApiResponse<AssistantAnswerDto>> {
    const response = await api.post<ApiResponse<AssistantAnswerDto>>('/v1/knowledge/chat', {
      question,
      history,
    });
    return response.data;
  },

  async status(): Promise<ApiResponse<AssistantStatusDto>> {
    const response = await api.get<ApiResponse<AssistantStatusDto>>('/v1/knowledge/status');
    return response.data;
  },
};
