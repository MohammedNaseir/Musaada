import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { projectsService, familyProjectService, familiesService } from '../../services';
import { Project, FamilyProject, Family } from '../../models/types';
import { ArrowLeft, Trash2, Search, X, HandHeart, Calendar, CheckCircle2, Loader2 } from 'lucide-react';

export default function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [disbursements, setDisbursements] = useState<(FamilyProject & { familyName: string, familyIdNumber: string })[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal search state
  const [searchq, setSearchq] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [foundFamily, setFoundFamily] = useState<Family | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register: dReg, handleSubmit: dHandleSubmit, reset: dReset } = useForm<Partial<FamilyProject>>();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    const pid = Number(id);
    const pData = await projectsService.getById(pid);
    if(pData) setProject(pData);

    const dData = await familyProjectService.getByProjectId(pid);
    const families = await familiesService.getAll();

    const fullDisb = dData.map(d => {
      const f = families.find(fam => fam.id === d.familyId);
      return { ...d, familyName: f?.headFullName || '', familyIdNumber: f?.headIdentityNumber || '' };
    });
    setDisbursements(fullDisb);
    setLoading(false);
  };

  const handleSearchFamily = async () => {
    if (!searchq) return;
    setHasSearched(false);
    const allFam = await familiesService.getAll();
    const match = allFam.find(f => f.headIdentityNumber === searchq || f.headFullName.includes(searchq));
    setFoundFamily(match || null);
    setHasSearched(true);
  };

  const onAddDisbursement = async (data: Partial<FamilyProject>) => {
    if(!foundFamily || !project) return;
    setIsSubmitting(true);
    try {
      await familyProjectService.add({
        familyId: foundFamily.id,
        projectId: project.id,
        disbursementDate: data.disbursementDate || new Date().toISOString().split('T')[0],
        quantity: data.quantity || '',
        status: data.status as any || 'تم الصرف'
      });
      setIsModalOpen(false);
      setFoundFamily(null);
      setSearchq('');
      setHasSearched(false);
      dReset();
      loadData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDisbursement = async (dId: number) => {
    if(window.confirm('متابعة إلغاء تخصيص المساعدة لهذه العائلة؟')){
      await familyProjectService.delete(dId);
      loadData();
    }
  }

  if (loading) return (
    <div className="flex h-[50vh] items-center justify-center text-[var(--secondary-400)]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-500)]"></div>
    </div>
  );
  if (!project) return <div className="text-center p-12 text-[var(--secondary-400)] font-semibold text-lg">مشروع غير موجود</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div className="flex items-center gap-4">
          <Link to="/projects" className="p-2 border border-[var(--grey-200)] bg-[var(--white)] rounded-md text-[var(--secondary-400)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--primary-500)] transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h2 className="h4 text-[var(--secondary-500)]">مشروع: {project.name}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
               <span className={`badge ${project.status === 'نشط' ? 'badge-success' : 
                        project.status === 'مخطط له' ? 'badge-info' : 'badge-muted'}`}>
                      {project.status}
              </span>
              <span className={`badge ${project.projectType === 'لمرة واحدة' ? 'badge-warning' : 'badge-primary'}`}>
                {project.projectType || 'مستمر'}
              </span>
              <span className="caption text-[var(--grey-500)] flex items-center gap-1.5 font-mono"><Calendar className="w-3.5 h-3.5"/> {project.startDate}</span>
            </div>
          </div>
        </div>
        
        <div>
           <button onClick={() => setIsModalOpen(true)} className="btn btn-primary h-[38px] whitespace-nowrap">
            <HandHeart className="w-4 h-4 mr-2" /> تخصيص لعائلة
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="card-header border-b border-[var(--grey-200)] px-6 py-5 mb-0 pb-5">
           <h3 className="card-title">العائلات المستفيدة المؤكدة من المساعدة</h3>
           <p className="body-4 text-[var(--grey-500)] mt-1">إجمالي المستفيدين (عائلات): {disbursements.length}</p>
        </div>
        <div className="overflow-x-auto overflow-y-auto">
          <table className="table min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-[var(--bg-tertiary)]">
              <tr>
                <th>اسم المستفيد</th>
                <th>الهوية</th>
                <th>تاريخ التخصيص</th>
                <th>الكمية</th>
                <th className="text-center">الحالة</th>
                <th className="text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {disbursements.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-[var(--grey-500)]">لا يوجد عائلات مستفيدة مخصصة لهذا المشروع حتى الآن</td></tr> : 
                disbursements.map(d => (
                <tr key={d.id}>
                  <td className="font-medium text-[var(--primary-500)]">{d.familyName}</td>
                  <td className="font-mono text-[var(--secondary-500)]">{d.familyIdNumber}</td>
                  <td className="text-[var(--secondary-500)] font-mono">{d.disbursementDate}</td>
                  <td className="text-[var(--secondary-500)] font-mono">{d.quantity || '-'}</td>
                  <td className="text-center">
                     <span className={`badge ${d.status === 'مكتمل' ? 'badge-success' : 
                            d.status === 'مؤجل' ? 'badge-warning' : 'badge-danger'}`}>
                          {d.status}
                        </span>
                  </td>
                  <td className="text-center">
                    <button onClick={() => handleDeleteDisbursement(d.id)} className="p-1.5 text-[var(--grey-400)] hover:text-[var(--alert-danger-500)] hover:bg-[var(--alert-danger-100)] rounded bg-[var(--white)] transition-colors border border-transparent hover:border-[var(--alert-danger-200)] mx-auto" title="إلغاء التخصيص"><Trash2 className="w-[18px] h-[18px]"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[var(--secondary-500)]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-xl relative animate-in zoom-in-95 duration-200 p-8">
            <button onClick={() => {setIsModalOpen(false); setFoundFamily(null); setHasSearched(false);}} className="absolute top-4 left-4 p-2 text-[var(--grey-400)] hover:text-[var(--secondary-500)] rounded-full transition-colors"><X className="w-5 h-5"/></button>
            
            <div className="mb-6 border-b border-[var(--grey-200)] pb-4">
               <h3 className="h6 text-[var(--secondary-500)] tracking-tight">تخصيص مساعدة لعائلة</h3>
               <p className="body-4 text-[var(--grey-500)] mt-1">ابحث عن العائلة المستهدفة لتأكيد الاستفادة</p>
            </div>
            
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                 <Search className="w-4 h-4 absolute right-3 top-2.5 text-[var(--grey-400)]" />
                 <input 
                  type="text" 
                  placeholder="ابحث برقم الهوية المكون من 9 أرقام أو الاسم..." 
                  value={searchq}
                  onChange={e => setSearchq(e.target.value)}
                  className="form-input pl-3 pr-9 py-2 text-sm h-[38px] w-full"
                />
              </div>
              <button type="button" onClick={handleSearchFamily} className="btn btn-outline h-[38px]">بحث</button>
            </div>

            {hasSearched && !foundFamily && (
               <div className="mb-6 p-4 bg-[var(--alert-warning-100)] text-[var(--alert-warning-600)] rounded-md flex flex-col items-center gap-3 border border-[var(--alert-warning-200)] animate-in fade-in">
                 <p className="font-semibold text-sm">لم يتم العثور على عائلة مطابقة لبيانات البحث.</p>
                 <Link to="/families/new" className="btn btn-primary h-[38px] min-w-[150px]">إضافة عائلة جديدة</Link>
               </div>
            )}

            {foundFamily && (
               <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="bg-[var(--alert-success-100)] border border-[var(--alert-success-200)] rounded-md p-4 mb-5 flex items-start gap-4">
                    <div className="p-2 bg-[var(--white)] text-[var(--alert-success-500)] rounded-lg shrink-0 mt-0.5"><CheckCircle2 className="w-5 h-5"/></div>
                    <div>
                       <p className="caption font-semibold text-[var(--alert-success-600)] mb-1">عائلة مؤكدة</p>
                       <p className="body-2 font-bold text-[var(--secondary-500)]">{foundFamily.headFullName}</p>
                       <p className="caption text-[var(--secondary-400)] font-mono mt-0.5">{foundFamily.headIdentityNumber}</p>
                    </div>
                 </div>

                <form onSubmit={dHandleSubmit(onAddDisbursement)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-field space-y-1.5">
                      <label className="form-label tracking-tight">تاريخ التخصيص</label>
                      <input type="date" {...dReg('disbursementDate', { required: true })} defaultValue={new Date().toISOString().split('T')[0]} className="form-input h-[38px] text-sm"/>
                    </div>
                    <div className="form-field space-y-1.5">
                      <label className="form-label tracking-tight">الكمية المقررة</label>
                      <input type="text" {...dReg('quantity')} placeholder="مثال: 2 كابونة" className="form-input h-[38px] text-sm"/>
                    </div>
                    <div className="col-span-2 form-field space-y-1.5">
                       <label className="form-label tracking-tight">حالة التخصيص</label>
                       <div className="relative">
                         <select {...dReg('status')} defaultValue="مكتمل" className="form-input h-[38px] text-sm appearance-none cursor-pointer">
                           <option value="مكتمل">مكتمل</option>
                           <option value="مؤجل">مؤجل (قيد الانتظار)</option>
                           <option value="ملغي">ملغي</option>
                         </select>
                       </div>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1 h-[38px]">
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تأكيد الاعتماد'}
                    </button>
                    <button type="button" onClick={() => {setFoundFamily(null); setIsModalOpen(false); setHasSearched(false);}} className="btn btn-outline flex-1 h-[38px]">إلغاء</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
