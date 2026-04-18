export interface Family {
  id: number;
  headIdentityNumber: string;
  headFullName: string;
  mobileNumber?: string;
  currentResidence: string;
  residenceBeforeWar?: string;
  isDisplaced: boolean;
  region: "شمال وادي غزة" | "جنوب وادي غزة" | "غير محدد";
  maritalStatus: "أعزب" | "متزوج" | "أرمل" | "مطلق";
  assigneeId?: number;
  notes?: string;
  memberCount: number;
}

export interface FamilyMember {
  id: number;
  familyId: number;
  identityNumber?: string;
  fullName: string;
  relation: "زوج" | "زوجة" | "ابن" | "ابنة" | "أب" | "أم" | "أخ" | "أخت" | "قريب" | "أخرى";
  birthDate?: string; // YYYY-MM-DD
  gender: "ذكر" | "أنثى";
  notes?: string;
}

export interface Project {
  id: number;
  name: string;
  assistanceTypeId: number;
  sourceId: number;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  description?: string;
  status: "نشط" | "منتهي" | "مخطط له";
  projectType?: "لمرة واحدة" | "مستمر";
}

export interface AssistanceType {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Source {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Assignee {
  id: number;
  name: string;
  isActive: boolean;
  notes?: string;
}

export interface FamilyProject {
  id: number;
  familyId: number;
  projectId: number;
  disbursementDate: string; // YYYY-MM-DD
  quantity?: string;
  status: "مكتمل" | "مؤجل" | "ملغي";
  notes?: string;
}
