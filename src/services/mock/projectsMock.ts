import { Project } from '../../models/types';
import { delay } from './utils';

let projects: Project[] = [
  { id: 1, name: 'إغاثة رمضان 2024', assistanceTypeId: 1, sourceId: 1, startDate: '2024-03-01', endDate: '2024-04-10', status: 'منتهي', projectType: 'مستمر', description: 'توزيع سلال غذائية لرمضان' },
  { id: 2, name: 'مساعدات شتوية', assistanceTypeId: 2, sourceId: 2, startDate: '2024-11-01', status: 'نشط', projectType: 'مستمر', description: 'مساعدات نقدية للخيام' },
  { id: 3, name: 'طرد صحي عاجل', assistanceTypeId: 3, sourceId: 1, startDate: '2024-05-15', status: 'نشط', projectType: 'لمرة واحدة' },
];

export const projectsMock = {
  async getAll(): Promise<Project[]> {
    await delay(200);
    return [...projects];
  },
  async getById(id: number): Promise<Project | undefined> {
    await delay(200);
    return projects.find(p => p.id === id);
  },
  async add(project: Omit<Project, 'id'>): Promise<Project> {
    await delay(400);
    if(projects.some(p => p.name === project.name)) throw new Error('اسم المشروع موجود مسبقاً');
    const newId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1;
    const newProject = { ...project, id: newId };
    projects.push(newProject);
    return newProject;
  },
  async update(id: number, data: Partial<Project>): Promise<Project | undefined> {
    await delay(400);
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    if (data.name && data.name !== projects[index].name) {
      if(projects.some(p => p.id !== id && p.name === data.name)) throw new Error('اسم المشروع مستخدم مسبقاً');
    }

    projects[index] = { ...projects[index], ...data };
    return projects[index];
  },
  async delete(id: number): Promise<boolean> {
    await delay(300);
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return false;
    projects.splice(index, 1);
    return true;
  }
};
