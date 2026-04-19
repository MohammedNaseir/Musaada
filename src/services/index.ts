import { familiesApi } from './api/familiesApi';
import { familyMembersApi } from './api/familyMembersApi';
import { projectsApi } from './api/projectsApi';
import { allocationsApi } from './api/allocationsApi';
import { assistanceTypesApi, sourcesApi, assigneesApi } from './api/settingsApi';

/**
 * خدمة بيانات العائلات (Families Data Service)
 * Endpoint: /api/families
 * Methods: GET, POST, PUT, DELETE
 */
export const familiesService = familiesApi;

/**
 * خدمة بيانات أفراد العائلة (Family Members Data Service)
 * Endpoint: /api/families/:id/members  |  /api/members/:id
 * Methods: GET, POST, PUT, DELETE
 */
export const familyMembersService = familyMembersApi;

/**
 * خدمة بيانات المشاريع الإغاثية (Projects Data Service)
 * Endpoint: /api/projects
 * Methods: GET, POST, PUT, DELETE
 */
export const projectsService = projectsApi;

/**
 * خدمة تخصيص المساعدات وربط العائلات بالمشاريع (Allocations Data Service)
 * Endpoint: /api/allocations
 * Methods: GET, POST, PUT, DELETE
 */
export const familyProjectService = allocationsApi;

/**
 * خدمة بيانات أنواع المساعدات (Assistance Types Lookup)
 * Endpoint: /api/assistance-types
 */
export const assistanceTypesService = assistanceTypesApi;

/**
 * خدمة بيانات الجهات المانحة والمصادر (Sources Lookup)
 * Endpoint: /api/sources
 */
export const sourcesService = sourcesApi;

/**
 * خدمة بيانات الجهات المكلفة بالتوزيع (Assignees Lookup)
 * Endpoint: /api/assignees
 */
export const assigneesService = assigneesApi;
