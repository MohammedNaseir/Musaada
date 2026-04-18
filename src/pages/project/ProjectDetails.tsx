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
    <div className="flex h-[50vh] items-center justify-center text-slate-500">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );
  if (!project) return <div className="text-center p-12 text-slate-500 font-semibold text-lg">مشروع غير موجود</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
          <Link to="/projects" className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"><ArrowLeft className="w-5 h-5 text-slate-600" /></Link>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">مشروع: {project.name}</h2>
            <div className="flex items-center gap-3 mt-1.5">
               <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold
                      ${project.status === 'نشط' ? 'bg-emerald-100 text-emerald-700' : 
                        project.status === 'مخطط له' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                      {project.status}
              </span>
              <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${project.projectType === 'لمرة واحدة' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                {project.projectType || 'مستمر'}
              </span>
              <span className="text-slate-500 text-xs flex items-center gap-1 font-mono"><Calendar className="w-3 h-3"/> {project.startDate}</span>
            </div>
          </div>
        </div>
        
        <div>
           <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer">
            <HandHeart className="w-4 h-4" /> تخصيص لعائلة
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div>
             <h3 className="font-bold text-lg text-slate-800">العائلات المستفيدة المؤكدة من المساعدة</h3>
             <p className="text-xs text-slate-500 mt-1">إجمالي المستفيدين (عائلات): {disbursements.length}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-white border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4">اسم المستفيد</th>
                <th className="px-6 py-4">الهوية</th>
                <th className="px-6 py-4">تاريخ التخصيص</th>
                <th className="px-6 py-4">الكمية</th>
                <th className="px-6 py-4 text-center">الحالة</th>
                <th className="px-6 py-4 text-center">التراجع / إلغاء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {disbursements.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-slate-400">لا يوجد عائلات مستفيدة مخصصة لهذا المشروع حتى الآن</td></tr> : 
                disbursements.map(d => (
                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-800">{d.familyName}</td>
                  <td className="px-6 py-4 font-mono text-slate-500">{d.familyIdNumber}</td>
                  <td className="px-6 py-4 text-slate-500">{d.disbursementDate}</td>
                  <td className="px-6 py-4 font-mono text-slate-700 font-semibold">{d.quantity || '-'}</td>
                  <td className="px-6 py-4 text-center">
                     <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold shadow-sm
                          ${d.status === 'مكتمل' ? 'bg-emerald-100 text-emerald-700' : 
                            d.status === 'مؤجل' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {d.status}
                        </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleDeleteDisbursement(d.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4 mx-auto"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-xl shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => {setIsModalOpen(false); setFoundFamily(null); setHasSearched(false);}} className="absolute top-6 left-6 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            
            <div className="mb-6 border-b border-slate-100 pb-4">
               <h3 className="text-xl font-extrabold text-slate-800">تخصيص مساعدة لعائلة</h3>
               <p className="text-sm text-slate-500 mt-1">ابحث عن العائلة المستهدفة لتأكيد الاستفادة</p>
            </div>
            
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                 <Search className="w-5 h-5 absolute right-4 top-3 text-slate-400" />
                 <input 
                  type="text" 
                  placeholder="ابحث برقم الهوية المكون من 9 أرقام أو الاسم..." 
                  value={searchq}
                  onChange={e => setSearchq(e.target.value)}
                  className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
                />
              </div>
              <button type="button" onClick={handleSearchFamily} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors shrink-0">بحث</button>
            </div>

            {hasSearched && !foundFamily && (
               <div className="mb-6 p-5 bg-amber-50 text-amber-800 rounded-xl flex flex-col items-center gap-3 border border-amber-100 animate-in fade-in">
                 <p className="font-semibold text-sm">لم يتم العثور على عائلة مطابقة لبيانات البحث.</p>
                 <Link to="/families/new" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition">إضافة عائلة جديدة</Link>
               </div>
            )}

            {foundFamily && (
               <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 mb-5 flex items-start gap-4">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0 mt-0.5"><CheckCircle2 className="w-5 h-5"/></div>
                    <div>
                       <p className="text-xs font-semibold text-emerald-600/80 mb-1">عائلة مؤكدة</p>
                       <p className="font-bold text-slate-800 text-lg">{foundFamily.headFullName}</p>
                       <p className="text-slate-500 font-mono mt-0.5">{foundFamily.headIdentityNumber}</p>
                    </div>
                 </div>

                <form onSubmit={dHandleSubmit(onAddDisbursement)} className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">تاريخ التخصيص</label>
                      <input type="date" {...dReg('disbursementDate', { required: true })} defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm font-medium text-slate-800 appearance-none"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">الكمية المقررة</label>
                      <input type="text" {...dReg('quantity')} placeholder="مثال: 2 كابونة" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm font-medium text-slate-800"/>
                    </div>
                    <div className="col-span-2">
                       <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">حالة التخصيص</label>
                      <select {...dReg('status')} defaultValue="مكتمل" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm font-medium text-slate-800 appearance-none">
                        <option value="مكتمل">مكتمل</option>
                        <option value="مؤجل">مؤجل (قيد الانتظار)</option>
                        <option value="ملغي">ملغي</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm flex justify-center items-center disabled:opacity-75">
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تأكيد الاعتماد'}
                    </button>
                    <button type="button" onClick={() => {setFoundFamily(null); setIsModalOpen(false); setHasSearched(false);}} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">إلغاء</button>
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
