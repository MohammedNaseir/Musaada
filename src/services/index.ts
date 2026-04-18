import { familiesMock } from './mock/familiesMock';
import { familyMembersMock } from './mock/familyMembersMock';
import { projectsMock } from './mock/projectsMock';
import { familyProjectMock } from './mock/familyProjectMock';
import { assistanceTypesMock, sourcesMock, assigneesMock } from './mock/settingsMock';

/**
 * 💡 كيفية التحويل لباك إيند حقيقي (API Integration Preview):
 *
 * حالياً يتم استخدام البيانات الوهمية (Mock Data) باستخدام LocalStorage والذاكرة.
 * للربط بـ API حقيقي (مثل Express أو Laravel أو .NET)، كل ما عليك فعله هو 
 * استبدال مصدر هذه الثوابت أدناه بطلبات Axios أو Fetch.
 *
 * 📖 راجع ملف القراءة `backend-api-specs.md` في مجلد المشروع الرئيسي 
 * لمشاهدة كافة تفاصيل مسارات الـ API وأنواع البيانات (Endpoints & Payloads).
 */

/**
 * خدمة بيانات العائلات (Families Data Service)
 * Endpoint: /api/families
 * Methods: GET, POST, PUT, DELETE
 */
export const familiesService = familiesMock;

/**
 * خدمة بيانات أفراد العائلة (Family Members Data Service)
 * Endpoint: /api/members أو /api/families/:id/members
 * Methods: GET, POST, PUT, DELETE
 */
export const familyMembersService = familyMembersMock;

/**
 * خدمة بيانات المشاريع الإغاثية (Projects Data Service)
 * Endpoint: /api/projects
 * Methods: GET, POST, PUT, DELETE
 */
export const projectsService = projectsMock;

/**
 * خدمة تخصيص المساعدات وربط العائلات بالمشاريع (Allocations Data Service)
 * Endpoint: /api/allocations أو /api/family-projects
 * Methods: GET, POST, PUT, DELETE
 */
export const familyProjectService = familyProjectMock;

/**
 * خدمة بيانات أنواع المساعدات (Assistance Types Lookup)
 * Endpoint: /api/settings/assistance-types
 */
export const assistanceTypesService = assistanceTypesMock;

/**
 * خدمة بيانات الجهات المانحة والمصادر (Sources Lookup)
 * Endpoint: /api/settings/sources
 */
export const sourcesService = sourcesMock;

/**
 * خدمة بيانات الجهات المكلفة بالتوزيع (Assignees Lookup)
 * Endpoint: /api/settings/assignees
 */
export const assigneesService = assigneesMock;

