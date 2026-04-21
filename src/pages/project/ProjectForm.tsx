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
    <div className="flex h-[50vh] items-center justify-center text-[var(--secondary-400)]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-500)]"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/projects" className="p-2.5 bg-[var(--white)] rounded-xl shadow-sm border border-[var(--grey-200)] hover:bg-[var(--bg-tertiary)] transition-colors"><ArrowLeft className="w-5 h-5 text-[var(--secondary-400)]" /></Link>
          <div>
            <h2 className="h4 text-[var(--secondary-500)] tracking-tight">{isEdit ? 'تعديل بيانات المشروع' : 'إضافة مشروع إغاثي جديد'}</h2>
            <p className="body-4 text-[var(--grey-500)] mt-1">تعبئة البيانات الأساسية وتفاصيل المشروع</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger animate-in slide-in-from-top-2">
          <AlertTriangle className="w-5 h-5 alert-icon" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="card-header border-b border-[var(--grey-200)] px-6 py-5 mb-0 pb-5">
           <h3 className="card-title">البيانات الأساسية للمشروع</h3>
        </div>
        <div className="px-6 py-6 border-b border-[var(--grey-100)]">
          <form id="project-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="md:col-span-2 form-field space-y-1.5">
              <label className="form-label tracking-tight">عنوان المشروع <span className="text-[var(--alert-danger-500)]">*</span></label>
              <input {...register('name', { required: 'عنوان المشروع مطلوب' })} placeholder="مثال: مشروع توزيع السلال الغذائية - رمضان" className={`form-input h-11 ${errors.name ? 'form-error' : ''}`} />
              {errors.name && <span className="form-helper text-[var(--alert-danger-500)]">{errors.name.message}</span>}
            </div>

            <div className="form-field space-y-1.5">
              <label className="form-label tracking-tight">نوع المساعدة <span className="text-[var(--alert-danger-500)]">*</span></label>
              <select {...register('assistanceTypeId', { required: true })} className="form-input h-11 appearance-none">
                <option value="">تحديد نوع المساعدة...</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="form-field space-y-1.5">
              <label className="form-label tracking-tight">المصدر / الجهة المانحة <span className="text-[var(--alert-danger-500)]">*</span></label>
              <select {...register('sourceId', { required: true })} className="form-input h-11 appearance-none">
                <option value="">تحديد الجهة المانحة...</option>
                {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="form-field space-y-1.5">
              <label className="form-label tracking-tight">تاريخ البدء <span className="text-[var(--alert-danger-500)]">*</span></label>
              <input type="date" {...register('startDate', { required: true })} className="form-input h-11 font-mono text-right" />
            </div>

            <div className="form-field space-y-1.5">
              <label className="form-label tracking-tight">تاريخ الانتهاء المتوقع</label>
              <input type="date" {...register('endDate')} className="form-input h-11 font-mono text-right" />
            </div>
            
            <div className="form-field space-y-1.5">
              <label className="form-label tracking-tight">دورية المشروع <span className="text-[var(--alert-danger-500)]">*</span></label>
              <select {...register('projectType')} defaultValue="لمرة واحدة" className="form-input h-11 appearance-none">
                <option value="لمرة واحدة">لمرة واحدة (طوارئ/حملة مؤقتة)</option>
                <option value="مستمر">مستمر (دوري)</option>
              </select>
            </div>
            
            <div className="form-field space-y-1.5">
              <label className="form-label tracking-tight">حالة المشروع <span className="text-[var(--alert-danger-500)]">*</span></label>
              <select {...register('status')} defaultValue="مخطط له" className="form-input h-11 appearance-none">
                <option value="مخطط له">مخطط له (لم يبدأ)</option>
                <option value="نشط">نشط (قيد التنفيذ)</option>
                <option value="منتهي">منتهي</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2 form-field">
              <label className="form-label tracking-tight">توصيف المشروع وملاحظات إضافية</label>
              <textarea {...register('description')} className="form-input py-3 resize-none" rows={4} placeholder="تفاصيل إضافية حول المشروع..."></textarea>
            </div>
            
          </form>
        </div>
        
        <div className="px-6 py-5 bg-[var(--bg-tertiary)] flex justify-end gap-3 flex-col sm:flex-row">
          <Link to="/projects" className="btn btn-outline min-w-[150px]">إلغاء وتراجع</Link>
          <button type="submit" form="project-form" disabled={isSubmitting} className="btn btn-primary min-w-[200px]">
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5 mr-2"/>
                {isEdit ? 'حفظ التعديلات' : 'اعتماد المشروع'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
