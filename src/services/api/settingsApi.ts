import { apiClient } from './apiClient';
import type { AssistanceType, Source, Assignee } from '../../models/types';

// ==================== Assistance Types ====================

export const assistanceTypesApi = {
  async getAll(): Promise<AssistanceType[]> {
    const res = await apiClient.get<AssistanceType[]>('/assistance-types');
    return res.data;
  },

  async add(item: Omit<AssistanceType, 'id'>): Promise<AssistanceType> {
    const res = await apiClient.post<AssistanceType>('/assistance-types', item);
    return res.data;
  },

  async update(id: number, data: Partial<Omit<AssistanceType, 'id'>>): Promise<AssistanceType> {
    const res = await apiClient.put<AssistanceType>(`/assistance-types/${id}`, data);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/assistance-types/${id}`);
  },
};

// ==================== Sources ====================

export const sourcesApi = {
  async getAll(): Promise<Source[]> {
    const res = await apiClient.get<Source[]>('/sources');
    return res.data;
  },

  async add(item: Omit<Source, 'id'>): Promise<Source> {
    const res = await apiClient.post<Source>('/sources', item);
    return res.data;
  },

  async update(id: number, data: Partial<Omit<Source, 'id'>>): Promise<Source> {
    const res = await apiClient.put<Source>(`/sources/${id}`, data);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/sources/${id}`);
  },
};

// ==================== Assignees ====================

export const assigneesApi = {
  async getAll(): Promise<Assignee[]> {
    const res = await apiClient.get<Assignee[]>('/assignees');
    return res.data;
  },

  async add(item: Omit<Assignee, 'id'>): Promise<Assignee> {
    const res = await apiClient.post<Assignee>('/assignees', item);
    return res.data;
  },

  async update(id: number, data: Partial<Omit<Assignee, 'id'>>): Promise<Assignee> {
    const res = await apiClient.put<Assignee>(`/assignees/${id}`, data);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/assignees/${id}`);
  },
};
