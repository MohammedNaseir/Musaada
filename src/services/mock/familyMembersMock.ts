import { FamilyMember } from '../../models/types';
import { delay } from './utils';

let members: FamilyMember[] = [
  { id: 1, familyId: 1, fullName: 'فاطمة سعد حسن', relation: 'زوجة', gender: 'أنثى', identityNumber: '222333444' },
  { id: 2, familyId: 1, fullName: 'حسن أحمد محمود', relation: 'ابن', gender: 'ذكر' },
  { id: 3, familyId: 1, fullName: 'نور أحمد محمود', relation: 'ابنة', gender: 'أنثى' },
];

export const familyMembersMock = {
  async getAll(): Promise<FamilyMember[]> {
    await delay(200);
    return [...members];
  },
  async getByFamilyId(familyId: number): Promise<FamilyMember[]> {
    await delay(200);
    return members.filter(m => m.familyId === familyId);
  },
  async add(member: Omit<FamilyMember, 'id'>): Promise<FamilyMember> {
    await delay(300);
    const newId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;
    const newMember = { ...member, id: newId };
    members.push(newMember);
    // Ideally we should update the memberCount in Family here or in the caller layer, 
    // but typically the UI or an orchestration layer handles this sync if there is no backend.
    return newMember;
  },
  async update(id: number, data: Partial<FamilyMember>): Promise<FamilyMember | undefined> {
    await delay(300);
    const index = members.findIndex(m => m.id === id);
    if (index === -1) return undefined;
    members[index] = { ...members[index], ...data };
    return members[index];
  },
  async delete(id: number): Promise<boolean> {
    await delay(200);
    const index = members.findIndex(m => m.id === id);
    if (index === -1) return false;
    members.splice(index, 1);
    return true;
  }
};
