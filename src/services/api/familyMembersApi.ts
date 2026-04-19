import { apiClient } from './apiClient';
import type { FamilyMember } from '../../models/types';

export const familyMembersApi = {
  async getAll(): Promise<FamilyMember[]> {
    const res = await apiClient.get<FamilyMember[]>('/members');
    return res.data;
  },

  async getByFamilyId(familyId: number): Promise<FamilyMember[]> {
    const res = await apiClient.get<FamilyMember[]>(`/families/${familyId}/members`);
    return res.data;
  },

  async add(member: Omit<FamilyMember, 'id'>): Promise<FamilyMember> {
    const res = await apiClient.post<FamilyMember>(
      `/families/${member.familyId}/members`,
      member
    );
    return res.data;
  },

  async update(id: number, data: Partial<Omit<FamilyMember, 'id' | 'familyId'>>): Promise<FamilyMember> {
    const res = await apiClient.put<FamilyMember>(`/members/${id}`, data);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/members/${id}`);
  },
};
