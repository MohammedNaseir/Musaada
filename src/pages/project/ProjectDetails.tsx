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
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div className="flex items-center gap-4">
          <Link to="/projects" className="p-2 border border-[#DBDADE] bg-white rounded-md text-[#5D596C] hover:bg-[#F4F5FA] hover:text-[#3D3B4A] transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h2 className="text-xl font-bold text-[#3D3B4A]">مشروع: {project.name}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
               <span className={`inline-flex px-2 py-0.5 rounded-full text-[13px] font-medium
                      ${project.status === 'نشط' ? 'bg-[#E8F9F0] text-[#28C76F]' : 
                        project.status === 'مخطط له' ? 'bg-[#E0F9FC] text-[#00CFE8]' : 'bg-[#F4F5FA] text-[#A5A3AE]'}`}>
                      {project.status}
              </span>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[13px] font-medium ${project.projectType === 'لمرة واحدة' ? 'bg-[#FFF0E1] text-[#FF9F43]' : 'bg-[#F0EEFF] text-[#7367F0]'}`}>
                {project.projectType || 'مستمر'}
              </span>
              <span className="text-[#A5A3AE] text-xs flex items-center gap-1.5 font-mono"><Calendar className="w-3.5 h-3.5"/> {project.startDate}</span>
            </div>
          </div>
        </div>
        
        <div>
           <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#7367F0] text-white font-medium rounded-md hover:bg-[#5E50EE] transition-colors shadow-sm cursor-pointer h-[38px] text-sm whitespace-nowrap">
            <HandHeart className="w-4 h-4" /> تخصيص لعائلة
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-[0_4px_24px_rgba(34,41,47,0.08)] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#E6E6E8]">
           <h3 className="font-bold text-lg text-[#3D3B4A]">العائلات المستفيدة المؤكدة من المساعدة</h3>
           <p className="text-sm text-[#A5A3AE] mt-1">إجمالي المستفيدين (عائلات): {disbursements.length}</p>
        </div>
        <div className="overflow-x-auto overflow-y-auto">
          <table className="w-full text-right whitespace-nowrap min-w-[800px]">
            <thead className="bg-[#F8F7FA] border-b border-[#E6E6E8] text-[#5D596C] sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-xs">اسم المستفيد</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-xs">الهوية</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-xs">تاريخ التخصيص</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-xs">الكمية</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-xs text-center">الحالة</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-xs text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E6E8]">
              {disbursements.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-[#A5A3AE]">لا يوجد عائلات مستفيدة مخصصة لهذا المشروع حتى الآن</td></tr> : 
                disbursements.map(d => (
                <tr key={d.id} className="hover:bg-[#7367F0]/[0.05] transition-colors h-[52px]">
                  <td className="px-6 py-2 font-medium text-[#7367F0]">{d.familyName}</td>
                  <td className="px-6 py-2 font-mono text-[#5D596C] text-sm">{d.familyIdNumber}</td>
                  <td className="px-6 py-2 text-[#5D596C] text-sm">{d.disbursementDate}</td>
                  <td className="px-6 py-2 text-[#5D596C] font-mono text-sm">{d.quantity || '-'}</td>
                  <td className="px-6 py-2 text-center">
                     <span className={`inline-flex px-2 py-0.5 rounded-full text-[13px] font-medium
                          ${d.status === 'مكتمل' ? 'bg-[#E8F9F0] text-[#28C76F]' : 
                            d.status === 'مؤجل' ? 'bg-[#FFF0E1] text-[#FF9F43]' : 'bg-[#FCEAEA] text-[#EA5455]'}`}>
                          {d.status}
                        </span>
                  </td>
                  <td className="px-6 py-2 text-center">
                    <button onClick={() => handleDeleteDisbursement(d.id)} className="p-2 text-[#A5A3AE] hover:text-[#EA5455] rounded-md transition-colors" title="إلغاء التخصيص"><Trash2 className="w-[18px] h-[18px] mx-auto"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 w-full max-w-xl shadow-[0_4px_24px_rgba(0,0,0,0.15)] relative animate-in zoom-in-95 duration-200">
            <button onClick={() => {setIsModalOpen(false); setFoundFamily(null); setHasSearched(false);}} className="absolute top-4 left-4 p-2 text-[#A5A3AE] hover:text-[#3D3B4A] rounded-full transition-colors"><X className="w-5 h-5"/></button>
            
            <div className="mb-6 border-b border-[#E6E6E8] pb-4">
               <h3 className="text-xl font-bold text-[#3D3B4A]">تخصيص مساعدة لعائلة</h3>
               <p className="text-sm text-[#A5A3AE] mt-1">ابحث عن العائلة المستهدفة لتأكيد الاستفادة</p>
            </div>
            
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                 <Search className="w-4 h-4 absolute right-3 top-2.5 text-[#A5A3AE]" />
                 <input 
                  type="text" 
                  placeholder="ابحث برقم الهوية المكون من 9 أرقام أو الاسم..." 
                  value={searchq}
                  onChange={e => setSearchq(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 bg-white border border-[#DBDADE] rounded-md focus:border-[#7367F0] focus:shadow-[0_0_0_3px_rgba(115,103,240,0.15)] outline-none transition-all text-sm h-[38px] text-[#5D596C]"
                />
              </div>
              <button type="button" onClick={handleSearchFamily} className="px-6 py-2 bg-[#F4F5FA] hover:bg-[#E6E6E8] text-[#5D596C] font-medium rounded-md transition-colors shrink-0 h-[38px] text-sm">بحث</button>
            </div>

            {hasSearched && !foundFamily && (
               <div className="mb-6 p-4 bg-[#FFF0E1] text-[#FF9F43] rounded-md flex flex-col items-center gap-3 border border-[#FF9F43]/20 animate-in fade-in">
                 <p className="font-semibold text-sm">لم يتم العثور على عائلة مطابقة لبيانات البحث.</p>
                 <Link to="/families/new" className="px-5 py-2 bg-[#7367F0] text-white rounded-md text-sm font-medium hover:bg-[#5E50EE] transition h-[38px] flex items-center">إضافة عائلة جديدة</Link>
               </div>
            )}

            {foundFamily && (
               <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="bg-[#E8F9F0] border border-[#28C76F]/20 rounded-md p-4 mb-5 flex items-start gap-4">
                    <div className="p-2 bg-[#28C76F]/10 text-[#28C76F] rounded-lg shrink-0 mt-0.5"><CheckCircle2 className="w-5 h-5"/></div>
                    <div>
                       <p className="text-xs font-semibold text-[#28C76F] mb-1">عائلة مؤكدة</p>
                       <p className="font-bold text-[#3D3B4A] text-lg">{foundFamily.headFullName}</p>
                       <p className="text-[#A5A3AE] font-mono mt-0.5 text-sm">{foundFamily.headIdentityNumber}</p>
                    </div>
                 </div>

                <form onSubmit={dHandleSubmit(onAddDisbursement)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-medium text-[#5D596C]">تاريخ التخصيص</label>
                      <input type="date" {...dReg('disbursementDate', { required: true })} defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 bg-white border border-[#DBDADE] rounded-md focus:border-[#7367F0] focus:shadow-[0_0_0_3px_rgba(115,103,240,0.15)] outline-none transition-all text-sm text-[#5D596C]"/>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-medium text-[#5D596C]">الكمية المقررة</label>
                      <input type="text" {...dReg('quantity')} placeholder="مثال: 2 كابونة" className="w-full px-3 py-2 bg-white border border-[#DBDADE] rounded-md focus:border-[#7367F0] focus:shadow-[0_0_0_3px_rgba(115,103,240,0.15)] outline-none transition-all text-sm text-[#5D596C]"/>
                    </div>
                    <div className="col-span-2 space-y-1.5">
                       <label className="block text-[13px] font-medium text-[#5D596C]">حالة التخصيص</label>
                       <div className="relative">
                         <select {...dReg('status')} defaultValue="مكتمل" className="w-full px-3 py-2 bg-white border border-[#DBDADE] rounded-md focus:border-[#7367F0] focus:shadow-[0_0_0_3px_rgba(115,103,240,0.15)] outline-none transition-all text-sm text-[#5D596C] appearance-none cursor-pointer">
                           <option value="مكتمل">مكتمل</option>
                           <option value="مؤجل">مؤجل (قيد الانتظار)</option>
                           <option value="ملغي">ملغي</option>
                         </select>
                       </div>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-[#7367F0] text-white rounded-md font-medium hover:bg-[#5E50EE] transition-colors flex justify-center items-center disabled:opacity-75 h-[38px] text-sm">
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تأكيد الاعتماد'}
                    </button>
                    <button type="button" onClick={() => {setFoundFamily(null); setIsModalOpen(false); setHasSearched(false);}} className="flex-1 py-2 bg-[#F4F5FA] text-[#5D596C] rounded-md font-medium hover:bg-[#E6E6E8] transition-colors h-[38px] text-sm">إلغاء</button>
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
