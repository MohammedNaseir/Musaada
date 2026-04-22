import axios from 'axios';
import type { Family, FamilyMember, Project, FamilyProject, AssistanceType, Source, Assignee } from '../models/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5122/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — clear session and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

/**
 * خدمة بيانات العائلات (Families Data Service)
 * Endpoint: /api/families
 */
export const familiesService = {
  async getAll(): Promise<Family[]> {
    const res = await api.get('/families');
    return res.data;
  },
  async getById(id: number): Promise<Family | undefined> {
    try {
      const res = await api.get(`/families/${id}`);
      return res.data;
    } catch { return undefined; }
  },
  async getByIdentityNumber(idNumber: string): Promise<Family | undefined> {
    try {
      const res = await api.get('/families/search', { params: { identityNumber: idNumber } });
      return res.data;
    } catch { return undefined; }
  },
  async add(family: Omit<Family, 'id' | 'memberCount'>): Promise<Family> {
    const res = await api.post('/families', family);
    return res.data;
  },
  async update(id: number, data: Partial<Family>): Promise<Family | undefined> {
    const res = await api.put(`/families/${id}`, data);
    return res.data;
  },
  async delete(id: number): Promise<boolean> {
    await api.delete(`/families/${id}`);
    return true;
  }
};

/**
 * خدمة بيانات أفراد العائلة (Family Members Data Service)
 * Endpoint: /api/families/:id/members  |  /api/members/:id
 */
export const familyMembersService = {
  async getAll(): Promise<FamilyMember[]> {
    const res = await api.get('/members');
    return res.data;
  },
  async getByFamilyId(familyId: number): Promise<FamilyMember[]> {
    const res = await api.get(`/families/${familyId}/members`);
    return res.data;
  },
  async add(member: Omit<FamilyMember, 'id'>): Promise<FamilyMember> {
    const res = await api.post(`/families/${member.familyId}/members`, member);
    return res.data;
  },
  async update(id: number, data: Partial<FamilyMember>): Promise<FamilyMember | undefined> {
    const res = await api.put(`/members/${id}`, data);
    return res.data;
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
    const res = await api.get('/projects');
    return res.data;
  },
  async getById(id: number): Promise<Project | undefined> {
    try {
      const res = await api.get(`/projects/${id}`);
      return res.data;
    } catch { return undefined; }
  },
  async add(project: Omit<Project, 'id'>): Promise<Project> {
    const res = await api.post('/projects', project);
    return res.data;
  },
  async update(id: number, data: Partial<Project>): Promise<Project | undefined> {
    const res = await api.put(`/projects/${id}`, data);
    return res.data;
  },
  async delete(id: number): Promise<boolean> {
    await api.delete(`/projects/${id}`);
    return true;
  }
};

/**
 * خدمة تخصيص المساعدات (Allocations Data Service)
 * Endpoint: /api/allocations
 */
export const familyProjectService = {
  async getAll(): Promise<FamilyProject[]> {
    const res = await api.get('/allocations');
    return res.data;
  },
  async getByFamilyId(familyId: number): Promise<FamilyProject[]> {
    const res = await api.get(`/families/${familyId}/allocations`);
    return res.data;
  },
  async getByProjectId(projectId: number): Promise<FamilyProject[]> {
    const res = await api.get(`/projects/${projectId}/allocations`);
    return res.data;
  },
  async add(data: Omit<FamilyProject, 'id'>): Promise<FamilyProject> {
    const res = await api.post('/allocations', data);
    return res.data;
  },
  async update(id: number, data: Partial<FamilyProject>): Promise<FamilyProject | undefined> {
    const res = await api.put(`/allocations/${id}`, data);
    return res.data;
  },
  async delete(id: number): Promise<boolean> {
    await api.delete(`/allocations/${id}`);
    return true;
  }
};

/**
 * خدمة بيانات أنواع المساعدات (Assistance Types Lookup)
 * Endpoint: /api/assistance-types
 */
export const assistanceTypesService = {
  async getAll(): Promise<AssistanceType[]> {
    const res = await api.get('/assistance-types');
    return res.data;
  },
  async add(data: Omit<AssistanceType, 'id'>): Promise<AssistanceType> {
    const res = await api.post('/assistance-types', data);
    return res.data;
  },
  async update(id: number, data: Partial<AssistanceType>): Promise<AssistanceType | undefined> {
    const res = await api.put(`/assistance-types/${id}`, data);
    return res.data;
  },
  async delete(id: number): Promise<boolean> {
    await api.delete(`/assistance-types/${id}`);
    return true;
  }
};

/**
 * خدمة بيانات الجهات المانحة (Sources Lookup)
 * Endpoint: /api/sources
 */
export const sourcesService = {
  async getAll(): Promise<Source[]> {
    const res = await api.get('/sources');
    return res.data;
  },
  async add(data: Omit<Source, 'id'>): Promise<Source> {
    const res = await api.post('/sources', data);
    return res.data;
  },
  async update(id: number, data: Partial<Source>): Promise<Source | undefined> {
    const res = await api.put(`/sources/${id}`, data);
    return res.data;
  },
  async delete(id: number): Promise<boolean> {
    await api.delete(`/sources/${id}`);
    return true;
  }
};

/**
 * خدمة بيانات الجهات المكلفة (Assignees Lookup)
 * Endpoint: /api/assignees
 */
export const assigneesService = {
  async getAll(): Promise<Assignee[]> {
    const res = await api.get('/assignees');
    return res.data;
  },
  async add(data: Omit<Assignee, 'id'>): Promise<Assignee> {
    const res = await api.post('/assignees', data);
    return res.data;
  },
  async update(id: number, data: Partial<Assignee>): Promise<Assignee | undefined> {
    const res = await api.put(`/assignees/${id}`, data);
    return res.data;
  },
  async delete(id: number): Promise<boolean> {
    await api.delete(`/assignees/${id}`);
    return true;
  }
};

/**
 * خدمة استيراد البيانات من Excel (Excel Import Service)
 * Endpoint: POST /api/import/import-excel
 */
export interface ImportResult {
  totalRows: number;
  skippedMartyrs: number;
  skippedEmptyIdentity: number;
  familiesCreated: number;
  membersCreated: number;
  assigneesCreated: number;
  errors: string[];
}

export const importService = {
  async importExcel(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/import/import-excel`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'فشل في استيراد الملف');
    }

    return response.json();
  }
};