import { apiClient } from './apiClient';
import type { FamilyProject } from '../../models/types';

export const allocationsApi = {
  async getAll(): Promise<FamilyProject[]> {
    const res = await apiClient.get<FamilyProject[]>('/allocations');
    return res.data;
  },

  async getByFamilyId(familyId: number): Promise<FamilyProject[]> {
    const res = await apiClient.get<FamilyProject[]>(`/families/${familyId}/allocations`);
    return res.data;
  },

  async getByProjectId(projectId: number): Promise<FamilyProject[]> {
    const res = await apiClient.get<FamilyProject[]>(`/projects/${projectId}/allocations`);
    return res.data;
  },

  async add(data: Omit<FamilyProject, 'id'>): Promise<FamilyProject> {
    const res = await apiClient.post<FamilyProject>('/allocations', data);
    return res.data;
  },

  async update(id: number, data: Partial<Omit<FamilyProject, 'id' | 'familyId' | 'projectId'>>): Promise<FamilyProject> {
    const res = await apiClient.put<FamilyProject>(`/allocations/${id}`, data);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/allocations/${id}`);
  },
};
