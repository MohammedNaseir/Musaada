import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { projectsService, assistanceTypesService, sourcesService } from '../../services';
import { Project, AssistanceType, Source } from '../../models/types';
import { ArrowLeft, AlertTriangle, Save, Loader2 } from 'lucide-react';

export default function ProjectForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [types, setTypes] = useState<AssistanceType[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Omit<Project, 'id'>>();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    const [allTypes, allSources] = await Promise.all([
      assistanceTypesService.getAll(),
      sourcesService.getAll()
    ]);
    setTypes(allTypes);
    setSources(allSources);

    if (isEdit) {
      const pid = Number(id);
      const data = await projectsService.getById(pid);
      if (data) reset(data);
    }
    setLoading(false);
  };

  const onSubmit = async (data: Omit<Project, 'id'>) => {
    setError(null);
    try {
      // Need to convert string values from select to numbers properly if needed
      const payload = {
        ...data,
        assistanceTypeId: Number(data.assistanceTypeId),
        sourceId: Number(data.sourceId)
      };

      if (isEdit) {
        await projectsService.update(Number(id), payload);
      } else {
        await projectsService.add(payload);
      }
      navigate('/projects');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ المشروع');
    }
  };

  if (loading) return (
    <div className="flex h-[50vh] items-center justify-center text-slate-500">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/projects" className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"><ArrowLeft className="w-5 h-5 text-slate-600" /></Link>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">{isEdit ? 'تعديل بيانات المشروع' : 'إضافة مشروع إغاثي جديد'}</h2>
            <p className="text-slate-500 text-sm mt-1">تعبئة البيانات الأساسية وتفاصيل المشروع</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100 shadow-sm animate-in slide-in-from-top-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
           <h3 className="font-bold text-lg text-slate-800">البيانات الأساسية للمشروع</h3>
        </div>
        <div className="p-8">
          <form id="project-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">عنوان المشروع <span className="text-red-500">*</span></label>
              <input {...register('name', { required: 'عنوان المشروع مطلوب' })} placeholder="مثال: مشروع توزيع السلال الغذائية - رمضان" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" />
              {errors.name && <span className="text-red-500 text-xs font-medium">{errors.name.message}</span>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">نوع المساعدة <span className="text-red-500">*</span></label>
              <select {...register('assistanceTypeId', { required: true })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none">
                <option value="">تحديد نوع المساعدة...</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">المصدر / الجهة المانحة <span className="text-red-500">*</span></label>
              <select {...register('sourceId', { required: true })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none">
                <option value="">تحديد الجهة المانحة...</option>
                {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">تاريخ البدء <span className="text-red-500">*</span></label>
              <input type="date" {...register('startDate', { required: true })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-slate-700 font-mono text-right" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">تاريخ الانتهاء المتوقع</label>
              <input type="date" {...register('endDate')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-slate-700 font-mono text-right" />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">دورية المشروع <span className="text-red-500">*</span></label>
              <select {...register('projectType')} defaultValue="لمرة واحدة" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none">
                <option value="لمرة واحدة">لمرة واحدة (طوارئ/حملة مؤقتة)</option>
                <option value="مستمر">مستمر (دوري)</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">حالة المشروع <span className="text-red-500">*</span></label>
              <select {...register('status')} defaultValue="مخطط له" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none">
                <option value="مخطط له">مخطط له (لم يبدأ)</option>
                <option value="نشط">نشط (قيد التنفيذ)</option>
                <option value="منتهي">منتهي</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">توصيف المشروع وملاحظات إضافية</label>
              <textarea {...register('description')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none" rows={4} placeholder="تفاصيل إضافية حول المشروع..."></textarea>
            </div>
            
          </form>
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <Link to="/projects" className="px-8 py-3 bg-white text-slate-600 rounded-xl hover:bg-slate-100 font-bold border border-slate-200 transition-all text-center">إلغاء وتراجع</Link>
          <button type="submit" form="project-form" disabled={isSubmitting} className="flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5 min-w-[200px] disabled:opacity-75 disabled:hover:translate-y-0">
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5"/>
                {isEdit ? 'حفظ التعديلات' : 'اعتماد المشروع'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
