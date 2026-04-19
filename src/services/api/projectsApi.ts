import { apiClient } from './apiClient';
import type { Project } from '../../models/types';

export const projectsApi = {
  async getAll(): Promise<Project[]> {
    const res = await apiClient.get<Project[]>('/projects');
    return res.data;
  },

  async getById(id: number): Promise<Project> {
    const res = await apiClient.get<Project>(`/projects/${id}`);
    return res.data;
  },

  async add(project: Omit<Project, 'id'>): Promise<Project> {
    const res = await apiClient.post<Project>('/projects', project);
    return res.data;
  },

  async update(id: number, data: Partial<Omit<Project, 'id'>>): Promise<Project> {
    const res = await apiClient.put<Project>(`/projects/${id}`, data);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/projects/${id}`);
  },
};
