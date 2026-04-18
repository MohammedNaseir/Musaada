import { Family } from '../../models/types';
import { delay } from './utils';

let families: Family[] = [
  { id: 1, headIdentityNumber: '123456789', headFullName: 'أحمد محمود حسن', mobileNumber: '0599123456', currentResidence: 'غزة - الشجاعية', residenceBeforeWar: 'غزة - الشجاعية', isDisplaced: false, region: 'شمال وادي غزة', maritalStatus: 'متزوج', assigneeId: 1, notes: 'حالة طارئة', memberCount: 4 },
  { id: 2, headIdentityNumber: '987654321', headFullName: 'محمد علي سالم', mobileNumber: '0599654321', currentResidence: 'خانيونس', residenceBeforeWar: 'غزة - الرمال', isDisplaced: true, region: 'جنوب وادي غزة', maritalStatus: 'متزوج', assigneeId: 2, notes: '', memberCount: 3 },
  { id: 3, headIdentityNumber: '456123789', headFullName: 'محمود خليل إبراهيم', mobileNumber: '0598111222', currentResidence: 'دير البلح', residenceBeforeWar: 'بيت لاهيا', isDisplaced: true, region: 'جنوب وادي غزة', maritalStatus: 'أرمل', assigneeId: undefined, notes: '', memberCount: 2 },
  { id: 4, headIdentityNumber: '321654987', headFullName: 'سعيد رمضان مصطفى', mobileNumber: '0597333444', currentResidence: 'رفح', residenceBeforeWar: 'غزة - النصر', isDisplaced: true, region: 'جنوب وادي غزة', maritalStatus: 'متزوج', assigneeId: 3, notes: '', memberCount: 5 },
  { id: 5, headIdentityNumber: '111222333', headFullName: 'يوسف جمال عبد الله', mobileNumber: '0592444555', currentResidence: 'النصيرات', residenceBeforeWar: 'غزة - الزيتون', isDisplaced: true, region: 'جنوب وادي غزة', maritalStatus: 'مطلق', assigneeId: undefined, notes: 'مريض', memberCount: 1 }
];

export const familiesMock = {
  async getAll(): Promise<Family[]> {
    await delay(300);
    return [...families];
  },
  async getById(id: number): Promise<Family | undefined> {
    await delay(200);
    return families.find(f => f.id === id);
  },
  async getByIdentityNumber(idNumber: string): Promise<Family | undefined> {
    await delay(200);
    return families.find(f => f.headIdentityNumber === idNumber);
  },
  async add(family: Omit<Family, 'id' | 'memberCount'>): Promise<Family> {
    await delay(400);
    if (families.some(f => f.headIdentityNumber === family.headIdentityNumber)) {
      throw new Error('رقم هوية رب الأسرة موجود بالفعل بين العائلات');
    }
    if (family.mobileNumber && families.some(f => f.mobileNumber === family.mobileNumber)) {
      throw new Error('رقم الجوال مسجل مسبقاً لعائلة أخرى');
    }
    const newId = families.length > 0 ? Math.max(...families.map(f => f.id)) + 1 : 1;
    const newFamily: Family = { ...family, id: newId, memberCount: 0 };
    families.push(newFamily);
    return newFamily;
  },
  async update(id: number, data: Partial<Family>): Promise<Family | undefined> {
    await delay(400);
    const index = families.findIndex(f => f.id === id);
    if (index === -1) return undefined;
    
    if (data.headIdentityNumber && data.headIdentityNumber !== families[index].headIdentityNumber) {
        if (families.some(f => f.id !== id && f.headIdentityNumber === data.headIdentityNumber)) {
            throw new Error('رقم هوية رب الأسرة مستخدم من قبل عائلة أخرى');
        }
    }
    if (data.mobileNumber && data.mobileNumber !== families[index].mobileNumber) {
        if (families.some(f => f.id !== id && f.mobileNumber === data.mobileNumber)) {
            throw new Error('رقم الجوال مستخدم من قبل عائلة أخرى');
        }
    }

    families[index] = { ...families[index], ...data };
    return families[index];
  },
  async delete(id: number): Promise<boolean> {
    await delay(300);
    const index = families.findIndex(f => f.id === id);
    if (index === -1) return false;
    families.splice(index, 1);
    return true;
  }
};
