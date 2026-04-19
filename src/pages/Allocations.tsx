import { useState, useEffect } from 'react';
import { familyProjectService, familiesService, projectsService } from '../services';
import { FamilyProject, Project } from '../models/types';
import { Search, HeartHandshake, Download, Plus, X, CheckCircle2, Loader2, Check, FileSpreadsheet } from 'lucide-react';
import { exportToExcel } from '../utils/export';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

export default function Allocations() {
  const [allocations, setAllocations] = useState<(FamilyProject & { familyName: string, projectName: string })[]>([]);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchq, setSearchq] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [foundFamily, setFoundFamily] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register: dReg, handleSubmit: dHandleSubmit, reset: dReset } = useForm<Partial<FamilyProject>>();
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Export Modal states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFileName, setExportFileName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [allAllocations, allFamilies, allProjects] = await Promise.all([
      familyProjectService.getAll(),
      familiesService.getAll(),
      projectsService.getAll()
    ]);
    
    setProjectsList(allProjects);

    const enriched = allAllocations.map(a => ({
      ...a,
      familyName: allFamilies.find(f => f.id === a.familyId)?.headFullName || 'غير معروف',
      projectName: allProjects.find(p => p.id === a.projectId)?.name || 'غير معروف'
    })).sort((a, b) => new Date(b.disbursementDate).getTime() - new Date(a.disbursementDate).getTime());
    
    setAllocations(enriched);
    setLoading(false);
  };

  const updateStatus = async (id: number, currentItem: FamilyProject, newStatus: FamilyProject['status']) => {
    await familyProjectService.update(id, { ...currentItem, status: newStatus });
    loadData();
  };

  const handleSearchFamily = async () => {
    if (!searchq) return;
    setHasSearched(false);
    const allFam = await familiesService.getAll();
    const match = allFam.find(f => f.headIdentityNumber === searchq || f.headFullName.includes(searchq));
    setFoundFamily(match || null);
    setHasSearched(true);
  };

  const onAddAllocation = async (data: Partial<FamilyProject>) => {
    if(!foundFamily || !data.projectId) return;
    setIsSubmitting(true);
    try {
      await familyProjectService.add({
        familyId: foundFamily.id,
        projectId: Number(data.projectId),
        disbursementDate: data.disbursementDate || new Date().toISOString().split('T')[0],
        quantity: data.quantity || '',
        status: data.status as any || 'مكتمل'
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

  const filtered = allocations.filter(a => 
    a.familyName.includes(searchTerm) || 
    a.projectName.includes(searchTerm)
  );
  
  const handleOpenExportModal = () => {
    const today = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    
    let baseName = 'تخصيص_المساعدات';
    if (searchTerm) {
      baseName += `_بحث_${searchTerm}`;
    }
    
    setExportFileName(`${baseName}_${today}`);
    setIsExportModalOpen(true);
  };

  const performExport = () => {
    const dataToExport = filtered.map((a, i) => ({
      '#': i + 1,
      'عائلة المستفيد': a.familyName,
      'اسم المشروع': a.projectName,
      'تاريخ التخصيص': a.disbursementDate,
      'الكمية المخصصة': a.quantity,
      'حالة التسليم': a.status
    }));
    const fileName = exportFileName.trim() ? exportFileName.trim() : 'تخصيص_المساعدات';
    exportToExcel(dataToExport, fileName);
    setIsExportModalOpen(false);
  };

  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_24px_rgba(34,41,47,0.08)] flex flex-col h-[calc(100vh-8rem)] overflow-hidden">
      <div className="px-6 py-5 border-b border-[#E6E6E8] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#3D3B4A]">سجل تخصيص المساعدات</h2>
          <p className="text-[#A5A3AE] text-sm mt-1">إدارة ومتابعة توزيع المساعدات والمشاريع على العائلات.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-[280px]">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-[#A5A3AE]" />
            <input 
              type="text" 
              placeholder="بحث باسم العائلة أو اسم المشروع..." 
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-3 pr-9 py-2 bg-white border border-[#DBDADE] rounded-md focus:border-[#7367F0] focus:shadow-[0_0_0_3px_rgba(115,103,240,0.15)] outline-none transition-all text-sm h-[38px] text-[#5D596C]"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={handleOpenExportModal} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-[#7367F0] text-[#7367F0] font-medium rounded-md hover:bg-[#7367F0]/10 transition-colors h-[38px] text-sm whitespace-nowrap">
               <Download className="w-4 h-4" /> تصدير
            </button>
            <button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#7367F0] text-white font-medium rounded-md hover:bg-[#5E50EE] transition-colors shadow-sm h-[38px] text-sm whitespace-nowrap">
              <Plus className="w-4 h-4" /> تخصيص لعائلة
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto bg-white relative">
        <table className="w-full text-right whitespace-nowrap min-w-[900px]">
          <thead className="bg-[#F8F7FA] sticky top-0 z-20 shadow-sm">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider">اسم العائلة المستفيدة</th>
              <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider">اسم المشروع</th>
              <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider">تاريخ التخصيص</th>
              <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider">الكمية المقررة</th>
              <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider text-center">الحالة الحالية</th>
              <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider text-center">تحديث الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E6E8]">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-20 text-[#A5A3AE]">
                 <div className="animate-pulse flex flex-col items-center gap-3">
                   <div className="w-8 h-8 rounded-full border-4 border-[#DBDADE] border-t-[#7367F0] animate-spin"></div>
                   <span className="text-sm font-medium">جاري تحميل البيانات...</span>
                 </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-20 text-[#A5A3AE]">
                <div className="flex flex-col items-center gap-2">
                  <HeartHandshake className="w-8 h-8 opacity-50" />
                  <p className="text-sm font-medium">لا توجد بيانات تخصيص</p>
                </div>
              </td></tr>
            ) : (
              paginatedData.map(a => (
                <tr key={a.id} className="hover:bg-[#7367F0]/[0.05] transition-colors even:bg-[#FAFAFA] h-[52px]">
                  <td className="px-6 py-2 font-medium text-[#7367F0]">{a.familyName}</td>
                  <td className="px-6 py-2 text-sm text-[#5D596C] font-semibold">{a.projectName}</td>
                  <td className="px-6 py-2 text-sm text-[#5D596C]">{a.disbursementDate}</td>
                  <td className="px-6 py-2 text-sm font-mono text-[#5D596C]">{a.quantity}</td>
                  <td className="px-6 py-2 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[13px] font-medium leading-5
                          ${a.status === 'مكتمل'? 'bg-[#E8F9F0] text-[#28C76F]' : 
                            a.status === 'مؤجل' ? 'bg-[#FFF0E1] text-[#FF9F43]' : 'bg-[#FCEAEA] text-[#EA5455]'}`}>
                          {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-2 text-center">
                     <div className="relative inline-block w-[100px]">
                       <select 
                         value={a.status}
                         onChange={e => updateStatus(a.id, a, e.target.value as any)}
                         className="w-full px-2 py-1.5 bg-white border border-[#DBDADE] rounded-md focus:border-[#7367F0] focus:shadow-[0_0_0_3px_rgba(115,103,240,0.15)] outline-none transition-all text-xs text-[#5D596C] appearance-none cursor-pointer"
                       >
                         <option value="مكتمل">مكتمل</option>
                         <option value="مؤجل">مؤجل</option>
                         <option value="ملغي">ملغي</option>
                       </select>
                     </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-[#E6E6E8] gap-4 mt-auto">
         <span className="text-sm text-[#A5A3AE]">
            عرض {(currentPage - 1) * itemsPerPage + 1} إلى {Math.min(currentPage * itemsPerPage, filtered.length)} من أصل {filtered.length} إدخال
         </span>
         <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded bg-[#F4F5FA] text-[#A5A3AE] text-sm hover:bg-[#7367F0] hover:text-white disabled:opacity-50 transition-colors">السابق</button>
            <button className="px-3 py-1.5 rounded bg-[#7367F0] text-white text-sm font-medium">{currentPage}</button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded bg-[#F4F5FA] text-[#A5A3AE] text-sm hover:bg-[#7367F0] hover:text-white disabled:opacity-50 transition-colors">التالي</button>
         </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 w-full max-w-xl shadow-[0_4px_24px_rgba(0,0,0,0.15)] relative animate-in zoom-in-95 duration-200">
            <button onClick={() => {setIsModalOpen(false); setFoundFamily(null); setHasSearched(false);}} className="absolute top-4 left-4 p-2 text-[#A5A3AE] hover:text-[#3D3B4A] rounded-full transition-colors"><X className="w-5 h-5"/></button>
            
            <div className="mb-6 border-b border-[#E6E6E8] pb-4">
               <h3 className="text-xl font-bold text-[#3D3B4A]">تخصيص مساعدة لعائلة</h3>
               <p className="text-sm text-[#A5A3AE] mt-1">اختر المشروع وابحث عن العائلة لتأكيد الاستفادة</p>
            </div>
            
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                 <Search className="w-5 h-5 absolute right-3 top-2.5 text-[#A5A3AE]" />
                 <input 
                  type="text" 
                  placeholder="ابحث برقم الهوية (9 أرقام) أو الاسم..." 
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
                 <Link to="/families/new" className="px-5 py-2 bg-[#7367F0] text-white rounded-md text-sm font-medium hover:bg-[#5E50EE] transition h-[38px] flex items-center">تسجيل عائلة جديدة</Link>
               </div>
            )}

            {foundFamily && (
               <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="bg-[#E8F9F0] border border-[#28C76F]/20 rounded-md p-4 mb-5 flex items-start gap-4">
                    <div className="p-2 bg-[#28C76F]/10 text-[#28C76F] rounded-lg shrink-0 mt-0.5"><CheckCircle2 className="w-5 h-5"/></div>
                    <div>
                       <p className="text-xs font-semibold text-[#28C76F] mb-1">عائلة مؤكدة</p>
                       <p className="font-bold text-slate-800 text-lg">{foundFamily.headFullName}</p>
                       <p className="text-[#A5A3AE] font-mono mt-0.5 text-sm">{foundFamily.headIdentityNumber}</p>
                    </div>
                 </div>

                <form onSubmit={dHandleSubmit(onAddAllocation)} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#5D596C]">تحديد المشروع <span className="text-[#EA5455]">*</span></label>
                    <div className="relative">
                       <select {...dReg('projectId', { required: true })} className="w-full px-3 py-2 bg-white border border-[#DBDADE] rounded-md focus:border-[#7367F0] focus:shadow-[0_0_0_3px_rgba(115,103,240,0.15)] outline-none transition-all text-sm text-[#5D596C] appearance-none cursor-pointer">
                          <option value="">-- اختر المشروع الأساسي --</option>
                          {projectsList.filter(p => p.status === 'نشط' || p.status === 'مخطط له').map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                       </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-medium text-[#5D596C]">تاريخ التخصيص</label>
                      <input type="date" {...dReg('disbursementDate')} defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 bg-white border border-[#DBDADE] rounded-md focus:border-[#7367F0] focus:shadow-[0_0_0_3px_rgba(115,103,240,0.15)] outline-none transition-all text-sm text-[#5D596C]"/>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-medium text-[#5D596C]">الكمية المقررة</label>
                      <input type="text" {...dReg('quantity')} placeholder="مثال: 2 وحدة" className="w-full px-3 py-2 bg-white border border-[#DBDADE] rounded-md focus:border-[#7367F0] focus:shadow-[0_0_0_3px_rgba(115,103,240,0.15)] outline-none transition-all text-sm text-[#5D596C]"/>
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
                       {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تأكيد التخصيص'}
                    </button>
                    <button type="button" onClick={() => {setFoundFamily(null); setIsModalOpen(false); setHasSearched(false);}} className="flex-1 py-2 bg-[#F4F5FA] text-[#5D596C] rounded-md font-medium hover:bg-[#E6E6E8] transition-colors h-[38px] text-sm">إلغاء</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 md:p-8 w-full max-w-md shadow-[0_4px_24px_rgba(0,0,0,0.15)] relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsExportModalOpen(false)} className="absolute top-4 left-4 p-2 text-[#A5A3AE] hover:text-[#3D3B4A] rounded-full transition-colors"><X className="w-5 h-5"/></button>
            
            <div className="mb-6">
               <h3 className="text-lg font-bold text-[#3D3B4A] mb-1 flex items-center gap-2">
                 <Download className="w-5 h-5 text-[#7367F0]" /> تصدير البيانات
               </h3>
               <p className="text-sm text-[#A5A3AE]">سيتم استخراج تخصيصات المساعدات المعروضة حالياً.</p>
            </div>
            
            <div className="space-y-5 mb-8">
              <div className="bg-[#F0EEFF] rounded-lg p-4 flex items-center gap-3">
                 <div className="bg-white text-[#7367F0] p-2 rounded-md shadow-sm">
                   <FileSpreadsheet className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-xs font-semibold text-[#7367F0]">إجمالي السجلات:</p>
                    <p className="font-bold text-[#3D3B4A]">{filtered.length} <span className="text-xs font-normal">سجل</span></p>
                 </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#5D596C] mb-2">تسمية الملف</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={exportFileName}
                    onChange={(e) => setExportFileName(e.target.value)}
                    className="w-full pl-12 pr-3 py-2 bg-white border border-[#DBDADE] rounded-md focus:border-[#7367F0] focus:shadow-[0_0_0_3px_rgba(115,103,240,0.15)] outline-none transition-all text-sm h-[38px] text-[#3D3B4A]"
                    placeholder="أدخل اسم الملف..."
                    dir="rtl"
                  />
                  <span className="absolute left-3 top-2.5 text-xs font-semibold text-[#A5A3AE] bg-[#F4F5FA] px-1.5 py-0.5 rounded">.xlsx</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={performExport}
                className="flex-1 py-2 bg-[#7367F0] text-white rounded-md font-medium hover:bg-[#5E50EE] transition-colors flex items-center justify-center gap-2 h-[38px] text-sm"
              >
                <Check className="w-[18px] h-[18px]"/> بدء التصدير القطعي
              </button>
              <button onClick={() => setIsExportModalOpen(false)} className="px-5 py-2 bg-[#F4F5FA] text-[#5D596C] rounded-md font-medium hover:bg-[#E6E6E8] transition-colors h-[38px] text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
