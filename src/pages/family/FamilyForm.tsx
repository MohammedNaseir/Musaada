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
          reset({ ...fData, assigneeId: fData.assigneeId ?? undefined });
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
        if (!window.confirm('تنبيه: رقم ההوية مكرر داخل نفس العائلة، هل ترغب في المتابعة؟')) return;
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
    <div className="flex h-[50vh] items-center justify-center text-slate-500">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/families" className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"><ArrowLeft className="w-5 h-5 text-slate-600" /></Link>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">{isEdit ? 'تعديل ملف العائلة' : 'تسجيل عائلة جديدة'}</h2>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100 shadow-sm">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-2">
          <button 
            type="button"
            className={`flex-1 py-3 px-4 font-semibold text-center rounded-xl transition-all ${activeTab === 'family' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:bg-slate-100/50'}`}
            onClick={() => setActiveTab('family')}
          >
            البيانات الأساسية لرب الأسرة
          </button>
          <button 
            type="button"
            className={`flex-1 py-3 px-4 font-semibold text-center rounded-xl transition-all ${activeTab === 'members' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:bg-slate-100/50'}`}
            onClick={() => setActiveTab('members')}
          >
            أفراد العائلة 
            <span className="mr-2 inline-flex items-center justify-center bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{members.length}</span>
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'family' && (
            <form id="family-form" onSubmit={handleSubmit(onSubmitFamily)} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">الاسم الرباعي <span className="text-red-500">*</span></label>
                <input {...register('headFullName', { required: 'الاسم مطلوب' })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
                {errors.headFullName && <span className="text-red-500 text-xs font-medium">{errors.headFullName.message}</span>}
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">رقم الهوية <span className="text-red-500">*</span></label>
                <input {...register('headIdentityNumber', { 
                  required: 'الهوية مطلوبة', 
                  pattern: { value: /^[0-9]{9}$/, message: 'رقم الهوية يجب أن يكون 9 أرقام بالضبط' }
                })} 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-mono text-left" dir="ltr" />
                {errors.headIdentityNumber && <span className="text-red-500 text-xs font-medium">{errors.headIdentityNumber.message}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">رقم الجوال الذكي</label>
                <input {...register('mobileNumber', {
                  pattern: { value: /^05[0-9]{8}$/, message: 'الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام' }
                })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-mono text-left" dir="ltr" placeholder="05XXXXXXXX" />
                {errors.mobileNumber && <span className="text-red-500 text-xs font-medium">{errors.mobileNumber.message}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">الحالة الاجتماعية <span className="text-red-500">*</span></label>
                <select {...register('maritalStatus', { required: true })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none">
                  <option value="متزوج">متزوج</option>
                  <option value="أعزب">أعزب</option>
                  <option value="أرمل">أرمل</option>
                  <option value="مطلق">مطلق</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">السكن الحالي (النزوح) <span className="text-red-500">*</span></label>
                <input {...register('currentResidence', { required: true })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">السكن الأصلي</label>
                <input {...register('residenceBeforeWar')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
              </div>

              <div className="space-y-1.5 flex items-center gap-3 pt-6 border-t border-slate-100 md:col-span-2">
                <input type="checkbox" id="isDisplaced" {...register('isDisplaced')} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="isDisplaced" className="text-sm font-semibold text-slate-700 cursor-pointer">تصنيف كعائلة نازحة (تم تهجيرها من سكنها الأصلي)</label>
              </div>

              <div className="space-y-1.5">
               <label className="block text-sm font-semibold text-slate-700">المنطقة الجغرافية حالياً <span className="text-red-500">*</span></label>
                <select {...register('region', { required: true })} defaultValue="غير محدد" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none">
                  <option value="غير محدد">غير محدد</option>
                  <option value="شمال وادي غزة">شمال وادي غزة</option>
                  <option value="جنوب وادي غزة">جنوب وادي غزة</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">الجهة المكلفة</label>
                <select {...register('assigneeId')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none">
                  <option value="">لا يوجد مكلف محدد...</option>
                  {assignees.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">ملاحظات إضافية</label>
                <textarea {...register('notes')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none" rows={3}></textarea>
              </div>
            </form>
          )}

          {activeTab === 'members' && (
            <div className="space-y-8">
              <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-2 mb-4 text-indigo-800">
                   <UserPlus className="w-5 h-5" />
                   <h4 className="font-bold text-lg">إضافة فرد جديد</h4>
                </div>
                <form onSubmit={mHandleSubmit(handleAddMember)} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  <div className="md:col-span-3 space-y-1">
                    <label className="block text-xs font-bold text-indigo-900/70">الاسم الرباعي</label>
                    <input {...mRegister('fullName', { required: true })} className="w-full px-3 py-2 bg-white border border-indigo-200/60 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm" placeholder="الاسم" />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-indigo-900/70">رقم الهوية</label>
                    <input {...mRegister('identityNumber', {
                      pattern: { value: /^[0-9]{9}$/, message: '9 أرقام' }
                    })} className="w-full px-3 py-2 bg-white border border-indigo-200/60 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm font-mono text-left" dir="ltr" placeholder="123456789" />
                    {mErrors.identityNumber && <span className="text-red-500 text-[10px] block mt-1">{mErrors.identityNumber.message}</span>}
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-indigo-900/70">الصلة</label>
                    <select {...mRegister('relation', { required: true })} defaultValue="ابن" className="w-full px-3 py-2 bg-white border border-indigo-200/60 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm appearance-none">
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
                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-indigo-900/70">الجنس</label>
                    <select {...mRegister('gender', { required: true })} className="w-full px-3 py-2 bg-white border border-indigo-200/60 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm appearance-none">
                      <option value="ذكر">ذكر</option>
                      <option value="أنثى">أنثى</option>
                    </select>
                  </div>
                  <div className="md:col-span-3 pt-5">
                    <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm shadow-sm transition-colors">
                      إضافة للجدول
                    </button>
                  </div>
                </form>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">الاسم</th>
                      <th className="px-5 py-3 font-semibold">الهوية</th>
                      <th className="px-5 py-3 font-semibold">الصلة</th>
                      <th className="px-5 py-3 font-semibold">الجنس</th>
                      <th className="px-5 py-3 font-semibold text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-slate-400">لم يتم إضافة أي أفراد للعائلة بعد.</td></tr> :
                      members.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-slate-800">{m.fullName}</td>
                          <td className="px-5 py-3 font-mono text-slate-600">{m.identityNumber || '-'}</td>
                          <td className="px-5 py-3 text-slate-600">{m.relation}</td>
                          <td className="px-5 py-3 text-slate-600">{m.gender}</td>
                          <td className="px-5 py-3 text-center">
                            <button type="button" onClick={() => removeMember(idx)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4 mx-auto" /></button>
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

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4">
          <button 
            type="submit" 
            form="family-form" 
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5 min-w-[200px] disabled:opacity-75 disabled:hover:translate-y-0"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin"/>
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
