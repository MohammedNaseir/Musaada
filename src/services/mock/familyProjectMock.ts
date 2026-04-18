import { FamilyProject } from '../../models/types';
import { delay } from './utils';

let familyProjects: FamilyProject[] = [
  { id: 1, familyId: 1, projectId: 1, disbursementDate: '2024-03-05', quantity: '1 كرتونة', status: 'مكتمل' },
  { id: 2, familyId: 2, projectId: 1, disbursementDate: '2024-03-05', quantity: '1 كرتونة', status: 'مكتمل' },
  { id: 3, familyId: 1, projectId: 2, disbursementDate: '2024-11-10', quantity: '100 دولار', status: 'مكتمل' },
  { id: 4, familyId: 3, projectId: 3, disbursementDate: '2024-05-16', quantity: '1 طرد', status: 'مؤجل' },
];

export const familyProjectMock = {
  async getAll(): Promise<FamilyProject[]> {
    await delay(200);
    return [...familyProjects];
  },
  async getByFamilyId(familyId: number): Promise<FamilyProject[]> {
    await delay(200);
    return familyProjects.filter(fp => fp.familyId === familyId);
  },
  async getByProjectId(projectId: number): Promise<FamilyProject[]> {
    await delay(200);
    return familyProjects.filter(fp => fp.projectId === projectId);
  },
  async add(record: Omit<FamilyProject, 'id'>): Promise<FamilyProject> {
    await delay(300);
    // Hard Validation: No duplicate family under same project
    if(familyProjects.some(fp => fp.familyId === record.familyId && fp.projectId === record.projectId)) {
        throw new Error('تم تخصيص مساعدة لهذه العائلة في نفس المشروع مسبقاً');
    }
    const newId = familyProjects.length > 0 ? Math.max(...familyProjects.map(fp => fp.id)) + 1 : 1;
    const newRecord = { ...record, id: newId };
    familyProjects.push(newRecord);
    return newRecord;
  },
  async update(id: number, data: Partial<FamilyProject>): Promise<FamilyProject | undefined> {
    await delay(300);
    const index = familyProjects.findIndex(fp => fp.id === id);
    if (index === -1) return undefined;
    familyProjects[index] = { ...familyProjects[index], ...data };
    return familyProjects[index];
  },
  async delete(id: number): Promise<boolean> {
    await delay(200);
    const index = familyProjects.findIndex(fp => fp.id === id);
    if (index === -1) return false;
    familyProjects.splice(index, 1);
    return true;
  }
};
