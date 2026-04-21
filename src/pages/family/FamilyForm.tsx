import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { familiesService, familyMembersService, assigneesService } from '../../services';
import { Family, FamilyMember, Assignee } from '../../models/types';
import { ArrowLeft, Trash2, AlertTriangle, UserPlus, Save, Loader2 } from 'lucide-react';

export default function FamilyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  const [activeTab, setActiveTab] = useState<'family' | 'members'>('family');
  const [members, setMembers] = useState<Partial<FamilyMember>[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Omit<Family, 'id' | 'memberCount'>>();
  const { register: mRegister, handleSubmit: mHandleSubmit, reset: mReset, setValue: mSetValue, control: mControl, formState: { errors: mErrors } } = useForm<FamilyMember>();

  const relationWatch = useWatch({ control: mControl, name: 'relation' });

  useEffect(() => {
    if (['زوجة', 'أم', 'ابنة', 'أخت'].includes(relationWatch as string)) {
      mSetValue('gender', 'أنثى');
    } else if (['زوج', 'أب', 'ابن', 'أخ'].includes(relationWatch as string)) {
      mSetValue('gender', 'ذكر');
    } else {
       mSetValue('gender', 'ذكر');
    }
  }, [relationWatch, mSetValue]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const allAssignees = await assigneesService.getAll();
      setAssignees(allAssignees);

      if (isEdit) {
        const fid = Number(id);
        const fData = await familiesService.getById(fid);
        if (fData) {
          reset({ ...fData, assigneeId: fData.assigneeId || '' });
        }
        const mData = await familyMembersService.getByFamilyId(fid);
        setMembers(mData as FamilyMember[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitFamily = async (data: Omit<Family, 'id' | 'memberCount'>) => {
    setError(null);
    try {
      const payload = {
        ...data,
        assigneeId: data.assigneeId ? Number(data.assigneeId) : undefined
      };

      const allMembers = await familyMembersService.getAll();
      const existAsMember = allMembers.some(m => m.identityNumber === payload.headIdentityNumber && m.familyId !== Number(id));
      if (existAsMember) {
        if (!window.confirm('تنبيه: رقم هوية رب الأسرة مسجل كفرد في عائلة أخرى. هل ترغب بالمتابعة؟')) return;
      }

      let savedFamilyId: number;
      if (isEdit) {
        const fid = Number(id);
        await familiesService.update(fid, payload);
        savedFamilyId = fid;
      } else {
        const saved = await familiesService.add(payload);
        savedFamilyId = saved.id;
      }

      const oldMembers = isEdit ? await familyMembersService.getByFamilyId(savedFamilyId) : [];
      for (const om of oldMembers) {
        if (!members.find(m => m.id === om.id)) {
          await familyMembersService.delete(om.id);
        }
      }

      for (const m of members) {
        if (m.id) {
          await familyMembersService.update(m.id, { ...m, familyId: savedFamilyId } as FamilyMember);
        } else {
          await familyMembersService.add({ ...m, familyId: savedFamilyId } as FamilyMember);
        }
      }

      navigate('/families');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  const handleAddMember = async (m: FamilyMember) => {
    if (m.identityNumber) {
      const exists = members.some(em => em.identityNumber === m.identityNumber);
      if (exists) {
        if (!window.confirm('تنبيه: رقم الهوية مكرر داخل نفس العائلة، هل ترغب في المتابعة؟')) return;
      }
      const allFamilies = await familiesService.getAll();
      const existAsHead = allFamilies.some(f => f.headIdentityNumber === m.identityNumber && f.id !== Number(id));
      if (existAsHead) {
        if (!window.confirm('تنبيه: رقم الهوية هذا مرتبط برب أسرة في عائلة أخرى. هل ترغب بالمتابعة؟')) return;
      }
    }
    setMembers([...members, { ...m }]);
    mReset();
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, idx) => idx !== index));
  };

  if (loading) return (
    <div className="flex h-[50vh] items-center justify-center text-[var(--secondary-400)]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-500)]"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/families" className="p-2 border border-[var(--grey-200)] bg-[var(--white)] rounded-md text-[var(--secondary-400)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--primary-500)] transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <h2 className="h4 text-[var(--secondary-500)] tracking-tight">{isEdit ? 'تعديل ملف العائلة' : 'تسجيل عائلة جديدة'}</h2>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-[var(--grey-200)] bg-[var(--bg-tertiary)] p-2 gap-2">
          <button 
            type="button"
            className={`flex-1 py-3 px-4 font-semibold text-center rounded-xl transition-all ${activeTab === 'family' ? 'bg-[var(--white)] text-[var(--primary-500)] shadow-sm border border-[var(--grey-200)]' : 'text-[var(--grey-500)] hover:bg-[var(--grey-100)]'}`}
            onClick={() => setActiveTab('family')}
          >
            البيانات الأساسية لرب الأسرة
          </button>
          <button 
            type="button"
            className={`flex-1 py-3 px-4 font-semibold text-center rounded-xl transition-all ${activeTab === 'members' ? 'bg-[var(--white)] text-[var(--primary-500)] shadow-sm border border-[var(--grey-200)]' : 'text-[var(--grey-500)] hover:bg-[var(--grey-100)]'}`}
            onClick={() => setActiveTab('members')}
          >
            أفراد العائلة 
            <span className="mr-2 inline-flex items-center justify-center bg-[var(--primary-100)] text-[var(--primary-500)] text-xs px-2 py-0.5 rounded-full">{members.length}</span>
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'family' && (
            <form id="family-form" onSubmit={handleSubmit(onSubmitFamily)} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="form-field space-y-1.5">
                <label className="form-label">الاسم الرباعي <span className="text-[var(--alert-danger-500)]">*</span></label>
                <input {...register('headFullName', { required: 'الاسم مطلوب' })} className={`form-input ${errors.headFullName ? 'form-error' : ''}`} />
                {errors.headFullName && <span className="form-helper">{errors.headFullName.message}</span>}
              </div>
              
              <div className="form-field space-y-1.5">
                <label className="form-label">رقم الهوية <span className="text-[var(--alert-danger-500)]">*</span></label>
                <input {...register('headIdentityNumber', { 
                  required: 'الهوية مطلوبة', 
                  pattern: { value: /^[0-9]{9}$/, message: 'رقم الهوية يجب أن يكون 9 أرقام بالضبط' }
                })} 
                className={`form-input font-mono text-left ${errors.headIdentityNumber ? 'form-error' : ''}`} dir="ltr" />
                {errors.headIdentityNumber && <span className="form-helper">{errors.headIdentityNumber.message}</span>}
              </div>

              <div className="form-field space-y-1.5">
                <label className="form-label">رقم الجوال الذكي</label>
                <input {...register('mobileNumber', {
                  pattern: { value: /^05[0-9]{8}$/, message: 'الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام' }
                })} className={`form-input font-mono z-[1] text-left ${errors.mobileNumber ? 'form-error' : ''}`} dir="ltr" placeholder="05XXXXXXXX" />
                {errors.mobileNumber && <span className="form-helper">{errors.mobileNumber.message}</span>}
              </div>

              <div className="form-field space-y-1.5">
                <label className="form-label">الحالة الاجتماعية <span className="text-[var(--alert-danger-500)]">*</span></label>
                <select {...register('maritalStatus', { required: true })} className="form-input appearance-none">
                  <option value="متزوج">متزوج</option>
                  <option value="أعزب">أعزب</option>
                  <option value="أرمل">أرمل</option>
                  <option value="مطلق">مطلق</option>
                </select>
              </div>

              <div className="form-field space-y-1.5">
                <label className="form-label">السكن الحالي (النزوح) <span className="text-[var(--alert-danger-500)]">*</span></label>
                <input {...register('currentResidence', { required: true })} className="form-input" />
              </div>

              <div className="form-field space-y-1.5">
                <label className="form-label">السكن الأصلي</label>
                <input {...register('residenceBeforeWar')} className="form-input" />
              </div>

              <div className="space-y-1.5 flex items-center gap-3 pt-6 border-t border-[var(--grey-200)] md:col-span-2">
                <input type="checkbox" id="isDisplaced" {...register('isDisplaced')} className="w-5 h-5 rounded border-[var(--grey-300)] text-[var(--primary-500)] focus:ring-[var(--primary-500)]" />
                <label htmlFor="isDisplaced" className="form-label cursor-pointer mb-0">تصنيف كعائلة نازحة (تم تهجيرها من سكنها الأصلي)</label>
              </div>

              <div className="form-field space-y-1.5">
               <label className="form-label">المنطقة الجغرافية حالياً <span className="text-[var(--alert-danger-500)]">*</span></label>
                <select {...register('region', { required: true })} defaultValue="غير محدد" className="form-input appearance-none">
                  <option value="غير محدد">غير محدد</option>
                  <option value="شمال وادي غزة">شمال وادي غزة</option>
                  <option value="جنوب وادي غزة">جنوب وادي غزة</option>
                </select>
              </div>

              <div className="form-field space-y-1.5">
                <label className="form-label">الجهة المكلفة</label>
                <select {...register('assigneeId')} className="form-input appearance-none">
                  <option value="">لا يوجد مكلف محدد...</option>
                  {assignees.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div className="md:col-span-2 form-field space-y-1.5">
                <label className="form-label">ملاحظات إضافية</label>
                <textarea {...register('notes')} className="form-input resize-y min-h-[100px]" rows={3}></textarea>
              </div>
            </form>
          )}

          {activeTab === 'members' && (
            <div className="space-y-8">
              <div className="bg-[var(--primary-100)]/50 p-6 rounded-2xl border border-[var(--primary-200)]">
                <div className="flex items-center gap-2 mb-4 text-[var(--primary-600)]">
                   <UserPlus className="w-5 h-5" />
                   <h4 className="font-bold text-lg">إضافة فرد جديد</h4>
                </div>
                <form onSubmit={mHandleSubmit(handleAddMember)} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  <div className="md:col-span-3 form-field space-y-1">
                    <label className="form-label text-xs tracking-tight">الاسم الرباعي</label>
                    <input {...mRegister('fullName', { required: true })} className="form-input h-10" placeholder="الاسم" />
                  </div>
                  <div className="md:col-span-3 form-field space-y-1">
                    <label className="form-label text-xs tracking-tight">رقم الهوية</label>
                    <input {...mRegister('identityNumber', {
                      pattern: { value: /^[0-9]{9}$/, message: '9 أرقام' }
                    })} className="form-input h-10 font-mono z-[1] text-left" dir="ltr" placeholder="123456789" />
                    {mErrors.identityNumber && <span className="form-helper">{mErrors.identityNumber.message}</span>}
                  </div>
                  <div className="md:col-span-2 form-field space-y-1">
                    <label className="form-label text-xs tracking-tight">الصلة</label>
                    <select {...mRegister('relation', { required: true })} defaultValue="ابن" className="form-input h-10 appearance-none">
                      <option value="زوجة">زوجة</option>
                      <option value="ابن">ابن</option>
                      <option value="ابنة">ابنة</option>
                      <option value="زوج">زوج</option>
                      <option value="أب">أب</option>
                      <option value="أم">أم</option>
                      <option value="أخ">أخ</option>
                      <option value="أخت">أخت</option>
                      <option value="قريب">قريب</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 form-field space-y-1">
                    <label className="form-label text-xs tracking-tight">الجنس</label>
                    <select {...mRegister('gender', { required: true })} className="form-input h-10 appearance-none">
                      <option value="ذكر">ذكر</option>
                      <option value="أنثى">أنثى</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 pt-6">
                    <button type="submit" className="btn btn-primary h-10 w-full mb-1">
                      إضافة
                    </button>
                  </div>
                </form>
              </div>

              <div className="border border-[var(--grey-200)] rounded-xl overflow-hidden shadow-sm">
                <table className="table min-w-[500px] rounded-none shadow-none mt-0">
                  <thead className="bg-[var(--bg-tertiary)]">
                    <tr>
                      <th>الاسم</th>
                      <th>الهوية</th>
                      <th>الصلة</th>
                      <th>الجنس</th>
                      <th className="text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-[var(--grey-500)]">لم يتم إضافة أي أفراد للعائلة بعد.</td></tr> :
                      members.map((m, idx) => (
                        <tr key={idx}>
                          <td className="font-bold text-[var(--secondary-500)]">{m.fullName}</td>
                          <td className="font-mono text-[var(--secondary-400)]">{m.identityNumber || '-'}</td>
                          <td>{m.relation}</td>
                          <td>{m.gender}</td>
                          <td className="text-center">
                            <button type="button" onClick={() => removeMember(idx)} className="p-1.5 text-[var(--grey-400)] hover:text-[var(--alert-danger-500)] hover:bg-[var(--alert-danger-100)] rounded transition-colors border border-transparent hover:border-[var(--alert-danger-200)]"><Trash2 className="w-[18px] h-[18px] mx-auto" /></button>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[var(--grey-200)] bg-[var(--bg-tertiary)] flex justify-end gap-4">
          <button 
            type="submit" 
            form="family-form" 
            disabled={isSubmitting}
            className="btn btn-primary min-w-[200px]"
          >
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 animate-spin"/> جاري الحفظ...</>
            ) : (
              <>
                <Save className="w-5 h-5"/>
                {isEdit ? 'حفظ التعديلات' : 'حفظ بيانات العائلة'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
