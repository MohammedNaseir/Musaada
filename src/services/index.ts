import axios from 'axios';
import { Family, FamilyMember, Project, FamilyProject, AssistanceType, Source, Assignee } from '../models/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to extract arrays from different API wrapper formats (like Laravel's { data: [...] } or simple JSON arrays)
function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

// Helper function to extract a single object
function extractObject(data: any): any {
  if (typeof data === 'string') return undefined; // Probably fetched an HTML error page
  if (data && data.data && typeof data.data === 'object' && !Array.isArray(data.data)) return data.data;
  return data;
}

/**
 * خدمة بيانات العائلات (Families Data Service)
 * Endpoint: /api/families
 */
export const familiesService = {
  async getAll(): Promise<Family[]> {
    try {
      const response = await api.get('/families');
      return extractArray(response.data);
    } catch { return []; }
  },
  async getById(id: number): Promise<Family | undefined> {
    try {
      const response = await api.get(`/families/${id}`);
      return extractObject(response.data);
    } catch { return undefined; }
  },
  async getByIdentityNumber(idNumber: string): Promise<Family | undefined> {
    try {
      const response = await api.get(`/families/search?identityNumber=${idNumber}`);
      return extractObject(response.data);
    } catch { return undefined; }
  },
  async add(family: Omit<Family, 'id' | 'memberCount'>): Promise<Family> {
    const response = await api.post('/families', family);
    return extractObject(response.data);
  },
  async update(id: number, data: Partial<Family>): Promise<Family | undefined> {
    const response = await api.put(`/families/${id}`, data);
    return extractObject(response.data);
  },
  async delete(id: number): Promise<boolean> {
    await api.delete(`/families/${id}`);
    return true;
  }
};

/**
 * خدمة بيانات أفراد العائلة (Family Members Data Service)
 * Endpoint: /api/members أو /api/families/:id/members
 */
export const familyMembersService = {
  async getByFamilyId(familyId: number): Promise<FamilyMember[]> {
    try {
      const response = await api.get(`/families/${familyId}/members`);
      return extractArray(response.data);
    } catch { return []; }
  },
  async add(member: Omit<FamilyMember, 'id'>): Promise<FamilyMember> {
    const response = await api.post(`/families/${member.familyId}/members`, member);
    return extractObject(response.data);
  },
  async update(id: number, data: Partial<FamilyMember>): Promise<FamilyMember | undefined> {
    const response = await api.put(`/members/${id}`, data);
    return extractObject(response.data);
  },
  async delete(id: number): Promise<boolean> {
    await api.delete(`/members/${id}`);
    return true;
  }
};

/**
 * خدمة بيانات المشاريع الإغاثية (Projects Data Service)
 * Endpoint: /api/projects
 */
export const projectsService = {
  async getAll(): Promise<Project[]> {
    try {
      const response = await api.get('/projects');
      return extractArray(response.data);
    } catch { return []; }
  },
  async getById(id: number): Promise<Project | undefined> {
    try {
      const response = await api.get(`/projects/${id}`);
      return extractObject(response.data);
    } catch { return undefined; }
  },
  async add(project: Omit<Project, 'id'>): Promise<Project> {
    const response = await api.post('/projects', project);
    return extractObject(response.data);
  },
  async update(id: number, data: Partial<Project>): Promise<Project | undefined> {
    const response = await api.put(`/projects/${id}`);
    return extractObject(response.data);
  },
  async delete(id: number): Promise<boolean> {
    await api.delete(`/projects/${id}`);
    return true;
  }
};

/**
 * خدمة تخصيص المساعدات وربط العائلات بالمشاريع (Allocations Data Service)
 * Endpoint: /api/allocations
 */
export const familyProjectService = {
  async getAll(): Promise<FamilyProject[]> {
    try {
      const response = await api.get('/allocations');
      return extractArray(response.data);
    } catch { return []; }
  },
  async getByFamilyId(familyId: number): Promise<FamilyProject[]> {
    try {
      const response = await api.get(`/families/${familyId}/allocations`);
      return extractArray(response.data);
    } catch { return []; }
  },
  async getByProjectId(projectId: number): Promise<FamilyProject[]> {
    try {
      const response = await api.get(`/projects/${projectId}/allocations`);
      return extractArray(response.data);
    } catch { return []; }
  },
  async add(data: Omit<FamilyProject, 'id'>): Promise<FamilyProject> {
    const response = await api.post('/allocations', data);
    return extractObject(response.data);
  },
  async update(id: number, data: Partial<FamilyProject>): Promise<FamilyProject | undefined> {
    const response = await api.put(`/allocations/${id}`, data);
    return extractObject(response.data);
  },
  async delete(id: number): Promise<boolean> {
    await api.delete(`/allocations/${id}`);
    return true;
  }
};

/**
 * خدمة بيانات أنواع المساعدات (Assistance Types Lookup)
 * Endpoint: /api/settings/assistance-types
 */
export const assistanceTypesService = {
  async getAll(): Promise<AssistanceType[]> {
    try {
      const response = await api.get('/settings/assistance-types');
      return extractArray(response.data);
    } catch { return []; }
  },
  async add(data: Omit<AssistanceType, 'id'>): Promise<AssistanceType> {
    const response = await api.post('/settings/assistance-types', data);
    return extractObject(response.data);
  },
  async update(id: number, data: Partial<AssistanceType>): Promise<AssistanceType | undefined> {
    const response = await api.put(`/settings/assistance-types/${id}`, data);
    return extractObject(response.data);
  },
  async delete(id: number): Promise<boolean> {
    await api.delete(`/settings/assistance-types/${id}`);
    return true;
  }
};

/**
 * خدمة بيانات الجهات المانحة والمصادر (Sources Lookup)
 * Endpoint: /api/settings/sources
 */
export const sourcesService = {
  async getAll(): Promise<Source[]> {
    try {
      const response = await api.get('/settings/sources');
      return extractArray(response.data);
    } catch { return []; }
  },
  async add(data: Omit<Source, 'id'>): Promise<Source> {
    const response = await api.post('/settings/sources', data);
    return extractObject(response.data);
  },
  async update(id: number, data: Partial<Source>): Promise<Source | undefined> {
    const response = await api.put(`/settings/sources/${id}`, data);
    return extractObject(response.data);
  },
  async delete(id: number): Promise<boolean> {
    await api.delete(`/settings/sources/${id}`);
    return true;
  }
};

/**
 * خدمة بيانات الجهات المكلفة بالتوزيع (Assignees Lookup)
 * Endpoint: /api/settings/assignees
 */
export const assigneesService = {
  async getAll(): Promise<Assignee[]> {
    try {
      const response = await api.get('/settings/assignees');
      return extractArray(response.data);
    } catch { return []; }
  },
  async add(data: Omit<Assignee, 'id'>): Promise<Assignee> {
    const response = await api.post('/settings/assignees', data);
    return extractObject(response.data);
  },
  async update(id: number, data: Partial<Assignee>): Promise<Assignee | undefined> {
    const response = await api.put(`/settings/assignees/${id}`, data);
    return extractObject(response.data);
  },
  async delete(id: number): Promise<boolean> {
    await api.delete(`/settings/assignees/${id}`);
    return true;
  }
};

