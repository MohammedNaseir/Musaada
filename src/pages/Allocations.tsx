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
    const [allocationsResult, familiesResult, projectsResult] = await Promise.allSettled([
      familyProjectService.getAll(),
      familiesService.getAll(),
      projectsService.getAll()
    ]);

    const allAllocations = allocationsResult.status === 'fulfilled' ? allocationsResult.value : [];
    const allFamilies = familiesResult.status === 'fulfilled' ? familiesResult.value : [];
    const allProjects = projectsResult.status === 'fulfilled' ? projectsResult.value : [];

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
    <div className="bg-white rounded-3xl shadow-[0_2px_20px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500 overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">سجل تخصيص المساعدات</h2>
          <p className="text-slate-500 text-sm mt-1">إدارة ومتابعة توزيع المساعدات والمشاريع على العائلات.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={handleOpenExportModal} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-100 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> تصدير Excel
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> تخصيص لعائلة
          </button>
        </div>
      </div>

      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 bg-white">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute right-4 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="بحث باسم العائلة أو اسم المشروع..." 
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white relative">
        <table className="w-full text-right text-sm whitespace-nowrap">
          <thead className="bg-slate-100 text-slate-700 font-extrabold sticky top-0 z-20 shadow-sm border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">اسم العائلة المستفيدة</th>
              <th className="px-6 py-4">اسم المشروع</th>
              <th className="px-6 py-4">تاريخ التخصيص</th>
              <th className="px-6 py-4">الكمية المقررة</th>
              <th className="px-6 py-4 text-center">الحالة الحالية</th>
              <th className="px-6 py-4 text-center">تحديث الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 relative z-0">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-20 text-slate-500">
                 <div className="animate-pulse flex flex-col items-center gap-3">
                   <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin"></div>
                   <span>جاري تحميل البيانات...</span>
                 </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-20 text-slate-400">
                <div className="flex flex-col items-center gap-2">
                  <HeartHandshake className="w-8 h-8 opacity-50" />
                  <p>لا توجد بيانات تخصيص</p>
                </div>
              </td></tr>
            ) : (
              paginatedData.map(a => (
                <tr key={a.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-5 font-bold text-slate-800">{a.familyName}</td>
                  <td className="px-6 py-5 text-indigo-700 font-semibold">{a.projectName}</td>
                  <td className="px-6 py-5 text-slate-500">{a.disbursementDate}</td>
                  <td className="px-6 py-5 font-mono text-slate-600 font-medium">{a.quantity}</td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold
                          ${a.status === 'مكتمل'? 'bg-emerald-100 text-emerald-700' : 
                            a.status === 'مؤجل' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                     <select 
                       value={a.status}
                       onChange={e => updateStatus(a.id, a, e.target.value as any)}
                       className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-xs font-medium appearance-none min-w-[80px]"
                     >
                       <option value="مكتمل">مكتمل</option>
                       <option value="مؤجل">مؤجل</option>
                       <option value="ملغي">ملغي</option>
                     </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between p-4 border-t border-slate-100 bg-slate-50/80 gap-4 mt-auto">
         <span className="text-xs text-slate-500 font-medium font-mono bg-white px-3 py-1.5 rounded border border-slate-200 shadow-sm">
            عرض {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} من أصل {filtered.length}
         </span>
         <div className="flex items-center gap-1.5">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-600 transition-colors shadow-sm">السابق</button>
            <span className="text-xs font-extrabold text-slate-700 px-3 bg-white py-2 rounded-lg border border-slate-200 shadow-sm">صفحة {currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-600 transition-colors shadow-sm">التالي</button>
         </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-xl shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => {setIsModalOpen(false); setFoundFamily(null); setHasSearched(false);}} className="absolute top-6 left-6 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            
            <div className="mb-6 border-b border-slate-100 pb-4">
               <h3 className="text-xl font-extrabold text-slate-800">تخصيص مساعدة لعائلة</h3>
               <p className="text-sm text-slate-500 mt-1">اختر المشروع وابحث عن العائلة لتأكيد الاستفادة</p>
            </div>
            
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                 <Search className="w-5 h-5 absolute right-4 top-3 text-slate-400" />
                 <input 
                  type="text" 
                  placeholder="ابحث برقم الهوية (9 أرقام) أو الاسم..." 
                  value={searchq}
                  onChange={e => setSearchq(e.target.value)}
                  className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
                />
              </div>
              <button type="button" onClick={handleSearchFamily} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors shrink-0">بحث</button>
            </div>

            {hasSearched && !foundFamily && (
               <div className="mb-6 p-5 bg-amber-50 text-amber-800 rounded-xl flex flex-col items-center gap-3 border border-amber-100 animate-in fade-in">
                 <p className="font-semibold text-sm">لم يتم العثور على عائلة مطابقة لبيانات البحث.</p>
                 <Link to="/families/new" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 transition">تسجيل عائلة جديدة</Link>
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

                <form onSubmit={dHandleSubmit(onAddAllocation)} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 ml-1">تحديد المشروع <span className="text-red-500">*</span></label>
                    <select {...dReg('projectId', { required: true })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-medium text-slate-800 appearance-none">
                       <option value="">-- اختر المشروع الأساسي --</option>
                       {projectsList.map(p => (
                         <option key={p.id} value={p.id}>{p.name}</option>
                       ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">تاريخ التخصيص</label>
                      <input type="date" {...dReg('disbursementDate')} defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-medium text-slate-800 appearance-none"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">الكمية المقررة</label>
                      <input type="text" {...dReg('quantity')} placeholder="مثال: 2 وحدة" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-medium text-slate-800"/>
                    </div>
                    <div className="col-span-2">
                       <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">حالة التخصيص</label>
                      <select {...dReg('status')} defaultValue="مكتمل" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-medium text-slate-800 appearance-none">
                        <option value="مكتمل">مكتمل</option>
                        <option value="مؤجل">مؤجل (قيد الانتظار)</option>
                        <option value="ملغي">ملغي</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm flex justify-center items-center disabled:opacity-75">
                       {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تأكيد التخصيص'}
                    </button>
                    <button type="button" onClick={() => {setFoundFamily(null); setIsModalOpen(false); setHasSearched(false);}} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">إلغاء</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsExportModalOpen(false)} className="absolute top-6 left-6 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            
            <div className="mb-6">
               <h3 className="text-xl font-extrabold text-slate-800 mb-1 flex items-center gap-2">
                 <Download className="w-5 h-5 text-emerald-600" /> تصدير البيانات
               </h3>
               <p className="text-sm text-slate-500">سيتم استخراج تخصيصات المساعدات المعروضة حالياً.</p>
            </div>
            
            <div className="space-y-5 mb-8">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                 <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                   <FileSpreadsheet className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-emerald-800">إجمالي السجلات:</p>
                    <p className="text-xl font-black text-emerald-700">{filtered.length} <span className="text-sm font-medium">سجل</span></p>
                 </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">تسمية الملف</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={exportFileName}
                    onChange={(e) => setExportFileName(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-800"
                    placeholder="أدخل اسم الملف..."
                    dir="rtl"
                  />
                  <span className="absolute left-4 top-3.5 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">.xlsx</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={performExport}
                className="flex-1 py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5"/> بدء التصدير القطعي
              </button>
              <button onClick={() => setIsExportModalOpen(false)} className="px-6 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
