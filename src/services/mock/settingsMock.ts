import { AssistanceType, Source, Assignee } from '../../models/types';
import { delay } from './utils';

let assistanceTypes: AssistanceType[] = [
  { id: 1, name: 'سلة غذائية', description: 'مواد تموينية أساسية', isActive: true },
  { id: 2, name: 'مساعدة نقدية', description: 'مبلغ مالي', isActive: true },
  { id: 3, name: 'طرود صحية', description: 'مواد تنظيف وعناية صحية', isActive: true },
];

let sources: Source[] = [
  { id: 1, name: 'مؤسسة إحسان', description: 'مؤسسة دولية خيرة', isActive: true },
  { id: 2, name: 'متبرع فاعل خير', description: 'تبرعات فردية', isActive: true },
];

let assignees: Assignee[] = [
  { id: 1, name: 'لجنة الزكاة المركزية', isActive: true },
  { id: 2, name: 'الجمعية الخيرية', isActive: true },
  { id: 3, name: 'لجنة الإغاثة', isActive: true },
];

export const assigneesMock = {
  async getAll(): Promise<Assignee[]> {
    await delay(200);
    return [...assignees];
  },
  async add(item: Omit<Assignee, 'id'>): Promise<Assignee> {
    await delay(300);
    if(assignees.some(a => a.name === item.name)) throw new Error('المكلف موجود مسبقاً');
    const newId = assignees.length > 0 ? Math.max(...assignees.map(a => a.id)) + 1 : 1;
    const newItem = { ...item, id: newId };
    assignees.push(newItem);
    return newItem;
  },
  async update(id: number, data: Partial<Assignee>): Promise<Assignee | undefined> {
    await delay(300);
    const index = assignees.findIndex(a => a.id === id);
    if (index === -1) return undefined;
    assignees[index] = { ...assignees[index], ...data };
    return assignees[index];
  },
  async delete(id: number): Promise<boolean> {
    await delay(200);
    const index = assignees.findIndex(a => a.id === id);
    if (index === -1) return false;
    assignees.splice(index, 1);
    return true;
  }
};

export const assistanceTypesMock = {
  async getAll(): Promise<AssistanceType[]> {
    await delay(200);
    return [...assistanceTypes];
  },
  async add(type: Omit<AssistanceType, 'id'>): Promise<AssistanceType> {
    await delay(300);
    if(assistanceTypes.some(t => t.name === type.name)) throw new Error('الاسم موجود مسبقاً');
    const newId = assistanceTypes.length > 0 ? Math.max(...assistanceTypes.map(t => t.id)) + 1 : 1;
    const newType = { ...type, id: newId };
    assistanceTypes.push(newType);
    return newType;
  },
  async update(id: number, data: Partial<AssistanceType>): Promise<AssistanceType | undefined> {
    await delay(300);
    const index = assistanceTypes.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    assistanceTypes[index] = { ...assistanceTypes[index], ...data };
    return assistanceTypes[index];
  },
  async delete(id: number): Promise<boolean> {
    await delay(200);
    const index = assistanceTypes.findIndex(t => t.id === id);
    if (index === -1) return false;
    assistanceTypes.splice(index, 1);
    return true;
  }
};

export const sourcesMock = {
  async getAll(): Promise<Source[]> {
    await delay(200);
    return [...sources];
  },
  async add(source: Omit<Source, 'id'>): Promise<Source> {
    await delay(300);
    if(sources.some(s => s.name === source.name)) throw new Error('الاسم موجود مسبقاً');
    const newId = sources.length > 0 ? Math.max(...sources.map(s => s.id)) + 1 : 1;
    const newSource = { ...source, id: newId };
    sources.push(newSource);
    return newSource;
  },
  async update(id: number, data: Partial<Source>): Promise<Source | undefined> {
    await delay(300);
    const index = sources.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    sources[index] = { ...sources[index], ...data };
    return sources[index];
  },
  async delete(id: number): Promise<boolean> {
    await delay(200);
    const index = sources.findIndex(s => s.id === id);
    if (index === -1) return false;
    sources.splice(index, 1);
    return true;
  }
};
