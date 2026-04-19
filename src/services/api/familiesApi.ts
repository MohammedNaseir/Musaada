import { apiClient } from './apiClient';
import type { Family } from '../../models/types';

export const familiesApi = {
  async getAll(): Promise<Family[]> {
    const res = await apiClient.get<Family[]>('/families');
    return res.data;
  },

  async getById(id: number): Promise<Family> {
    const res = await apiClient.get<Family>(`/families/${id}`);
    return res.data;
  },

  async getByIdentityNumber(identityNumber: string): Promise<Family | null> {
    try {
      const res = await apiClient.get<Family>(`/families/search`, {
        params: { identityNumber },
      });
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  },

  async add(family: Omit<Family, 'id' | 'memberCount'>): Promise<Family> {
    const res = await apiClient.post<Family>('/families', family);
    return res.data;
  },

  async update(id: number, data: Partial<Omit<Family, 'id' | 'memberCount'>>): Promise<Family> {
    const res = await apiClient.put<Family>(`/families/${id}`, data);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/families/${id}`);
  },
};
