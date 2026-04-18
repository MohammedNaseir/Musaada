# دليل تكامل الواجهة الخلفية (Backend API Integration Guide)

هذا الملف يحتوي على توثيق كامل لكافة الوظائف (Functions) المستخدمة في النظام (عبر مجلد `services`) لكي يسهل عليك مستقبلاً استبدال البيانات الوهمية (Mock Data) بواجهة برمجة تطبيقات حقيقية (RESTful API). 

بدلاً من كتابة الكود محلياً، ستقوم باستبدال كل دالة في `services` بطلب عبر `axios` أو `fetch` إلى المسار الموضح.

---

## 1. عائلات المستفيدين (Families)

### جلب جميع العائلات
- **الدالةالحالية:** `familiesService.getAll()`
- **المسار (Endpoint):** `GET /api/families`
- **الاستجابة:** مصفوفة من كائنات `Family`
- **ملاحظات:** يفضل إضافة دعم تقسيم الصفحات (Pagination) من السيرفر كالتالي: `GET /api/families?page=1&limit=50`

### جلب عائلة برقم المعرف
- **الدالة:** `familiesService.getById(id)`
- **المسار:** `GET /api/families/:id`
- **الاستجابة:** كائن `Family`

### البحث عن عائلة برقم الهوية
- **الدالة:** `familiesService.getByIdentityNumber(idNumber)`
- **المسار:** `GET /api/families/search?identityNumber=:idNumber`
- **الاستجابة:** كائن `Family`

### إضافة عائلة جديدة
- **الدالة:** `familiesService.add(family)`
- **المسار:** `POST /api/families`
- **البيانات المرسلة (Body):**
```json
{
  "headIdentityNumber": "123456789",
  "headFullName": "اسم رب الأسرة",
  "mobileNumber": "059...",
  "currentResidence": "غزة",
  "residenceBeforeWar": "غزة",
  "isDisplaced": true,
  "region": "جنوب وادي غزة",
  "maritalStatus": "متزوج",
  "notes": "ملاحظات إضافية"
}
```

### تعديل بيانات العائلة
- **الدالة:** `familiesService.update(id, data)`
- **المسار:** `PUT` أو `PATCH /api/families/:id`

### حذف عائلة
- **الدالة:** `familiesService.delete(id)`
- **المسار:** `DELETE /api/families/:id`

---

## 2. أفراد العائلة (Family Members)

تعمل هذه الوظائف على جلب تفاصيل أفراد كل أسرة بناءً على معرف العائلة.

### جلب الأفراد لعائلة معينة
- **الدالة:** `familyMembersService.getByFamilyId(familyId)`
- **المسار:** `GET /api/families/:familyId/members`
- **الاستجابة:** مصفوفة من `FamilyMember`

### إضافة فرد جديد للأسرة
- **الدالة:** `familyMembersService.add(member)`
- **المسار:** `POST /api/families/:familyId/members`

### تعديل بيانات الفرد
- **الدالة:** `familyMembersService.update(id, data)`
- **المسار:** `PUT /api/members/:id`

### حذف الفرد
- **الدالة:** `familyMembersService.delete(id)`
- **المسار:** `DELETE /api/members/:id`

---

## 3. المشاريع الإغاثية (Projects)

### جلب جميع المشاريع
- **الدالة:** `projectsService.getAll()`
- **المسار:** `GET /api/projects`

### جلب تفاصيل المشروع
- **الدالة:** `projectsService.getById(id)`
- **المسار:** `GET /api/projects/:id`

### إضافة مشروع جديد
- **الدالة:** `projectsService.add(project)`
- **المسار:** `POST /api/projects`
- **البيانات المرسلة (Body):**
```json
{
  "name": "سلة غذائية مكفولين",
  "assistanceTypeId": 1,
  "sourceId": 1,
  "projectType": "لمرة واحدة",
  "startDate": "2024-01-01",
  "status": "مخطط له"
}
```

### تعديل / حذف المشروع
- **الدوال:** `update`, `delete`
- **المسار:** `PUT /api/projects/:id` و `DELETE /api/projects/:id`

---

## 4. تخصيص المساعدات (Family-Project Allocations)

تربط هذه الوظائف العائلة بالمشروع وتسجل الدفعات والمساعدات المستلمة.

### جلب كافة التخصيصات المُسجلة
- **الدالة:** `familyProjectService.getAll()`
- **المسار:** `GET /api/allocations`

### جلب التخصيصات لعائلة معينة (لرؤية ما استلمته)
- **الدالة:** `familyProjectService.getByFamilyId(familyId)`
- **المسار:** `GET /api/families/:familyId/allocations`

### جلب العائلات المستفيدة من مشروع معين
- **الدالة:** `familyProjectService.getByProjectId(projectId)`
- **المسار:** `GET /api/projects/:projectId/allocations`

### تخصيص مساعدة (ربط عائلة بمشروع)
- **الدالة:** `familyProjectService.add(data)`
- **المسار:** `POST /api/allocations`
- **البيانات المرسلة (Body):**
```json
{
  "familyId": 12,
  "projectId": 5,
  "disbursementDate": "2024-04-18",
  "quantity": "1 طرد",
  "status": "مكتمل"
}
```

---

## 5. الإعدادات والثوابت (Settings & Lookups)

هذه البيانات تعتبر قواميس (Lookups) لنظام المنسدلات مثل الجهات المانحة والمكلفين.

- **جلب أنواع المساعدات:** `GET /api/assistance-types`
- **جلب الجهات المانحة:** `GET /api/sources`
- **جلب الجهات المكلفة (Assignees):** `GET /api/assignees`

*يمكن تطبيق عمليات الـ CRUD العادية (POST, PUT, DELETE) لهذه المسارات كما هو موثق في `settingsMock.ts`.*

---

## مثال على استبدال `Mock Service` بـ `Real API Service`

لنفترض أنك توقفت عن استخدام الـ Mock وتريد تشغيل جلب العائلات من السيرفر. ستذهب إلى ملف `src/services/index.ts` وتقوم بالتالي:

```typescript
// بدل هذا:
// export const familiesService = familiesMock;

// سيتم إنشاء الكود التالي:
import axios from 'axios';

const API_BASE_URL = 'https://your-backend-api.com/api';

export const familiesService = {
  async getAll() {
    const response = await axios.get(`${API_BASE_URL}/families`);
    return response.data;
  },
  async getById(id: number) {
    const response = await axios.get(`${API_BASE_URL}/families/${id}`);
    return response.data;
  },
  async add(familyData) {
    const response = await axios.post(`${API_BASE_URL}/families`, familyData);
    return response.data;
  }
  // المتابعة بنفس النمط لباقي الدوال...
};
```
