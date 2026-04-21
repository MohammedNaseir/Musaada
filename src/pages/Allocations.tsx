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
    <div className="card p-0 flex flex-col h-[calc(100vh-8rem)] overflow-hidden">
      <div className="card-header border-b border-[var(--grey-200)] px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-0 pb-5">
        <div>
          <h2 className="card-title">سجل تخصيص المساعدات</h2>
          <p className="card-subtitle mt-1">إدارة ومتابعة توزيع المساعدات والمشاريع على العائلات.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-[280px]">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-[var(--grey-400)]" />
            <input 
              type="text" 
              placeholder="بحث باسم العائلة أو اسم المشروع..." 
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="form-input pl-3 pr-9 py-2 text-sm h-[38px] w-full"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={handleOpenExportModal} className="btn btn-outline flex-1 sm:flex-none h-[38px] whitespace-nowrap">
               <Download className="w-4 h-4 mr-2" /> تصدير
            </button>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary flex-1 sm:flex-none h-[38px] whitespace-nowrap">
              <Plus className="w-4 h-4 mr-2" /> تخصيص لعائلة
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto relative">
        <table className="table min-w-[900px]">
          <thead className="sticky top-0 z-20">
            <tr>
              <th>اسم العائلة المستفيدة</th>
              <th>اسم المشروع</th>
              <th>تاريخ التخصيص</th>
              <th>الكمية المقررة</th>
              <th className="text-center">الحالة الحالية</th>
              <th className="text-center">تحديث الحالة</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-20 text-[var(--grey-500)]">
                 <div className="animate-pulse flex flex-col items-center gap-3">
                   <div className="w-8 h-8 rounded-full border-4 border-[var(--grey-200)] border-t-[var(--primary-500)] animate-spin"></div>
                   <span className="text-sm font-medium">جاري تحميل البيانات...</span>
                 </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-20 text-[var(--grey-500)]">
                <div className="flex flex-col items-center gap-2">
                  <HeartHandshake className="w-8 h-8 opacity-50" />
                  <p className="text-sm font-medium">لا توجد بيانات تخصيص</p>
                </div>
              </td></tr>
            ) : (
              paginatedData.map(a => (
                <tr key={a.id}>
                  <td className="font-medium text-[var(--primary-500)]">{a.familyName}</td>
                  <td className="text-[var(--secondary-500)] font-semibold">{a.projectName}</td>
                  <td className="text-[var(--secondary-500)] font-mono text-sm">{a.disbursementDate}</td>
                  <td className="text-[var(--secondary-500)] font-mono text-sm">{a.quantity}</td>
                  <td className="text-center">
                    <span className={`badge
                          ${a.status === 'مكتمل'? 'badge-success' : 
                            a.status === 'مؤجل' ? 'badge-warning' : 'badge-danger'}`}>
                          {a.status}
                    </span>
                  </td>
                  <td className="text-center">
                     <div className="relative inline-block w-[100px]">
                       <select 
                         value={a.status}
                         onChange={e => updateStatus(a.id, a, e.target.value as any)}
                         className="form-input px-2 py-1.5 text-xs appearance-none cursor-pointer"
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

      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-[var(--grey-200)] gap-4 mt-auto bg-[var(--white)]">
         <span className="body-4 text-[var(--grey-500)]">
            عرض {(currentPage - 1) * itemsPerPage + 1} إلى {Math.min(currentPage * itemsPerPage, filtered.length)} من أصل {filtered.length} إدخال
         </span>
         <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-pagination">السابق</button>
            <button className="btn-pagination-active">{currentPage}</button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn-pagination">التالي</button>
         </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[var(--secondary-500)]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => {setIsModalOpen(false); setFoundFamily(null); setHasSearched(false);}} className="absolute top-4 left-4 p-2 text-[var(--grey-400)] hover:text-[var(--secondary-500)] rounded-full transition-colors"><X className="w-5 h-5"/></button>
            
            <div className="mb-6 border-b border-[var(--grey-200)] pb-4">
               <h3 className="h6 text-[var(--secondary-500)] tracking-tight">تخصيص مساعدة لعائلة</h3>
               <p className="body-4 text-[var(--grey-500)] mt-1">اختر المشروع وابحث عن العائلة لتأكيد الاستفادة</p>
            </div>
            
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                 <Search className="w-5 h-5 absolute right-3 top-2.5 text-[var(--grey-400)]" />
                 <input 
                  type="text" 
                  placeholder="ابحث برقم الهوية (9 أرقام) أو الاسم..." 
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
                 <Link to="/families/new" className="btn btn-primary h-[38px] min-w-[150px]">تسجيل عائلة جديدة</Link>
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

                <form onSubmit={dHandleSubmit(onAddAllocation)} className="space-y-4">
                  <div className="form-field space-y-1.5">
                    <label className="form-label tracking-tight">تحديد المشروع <span className="text-[var(--alert-danger-500)]">*</span></label>
                    <div className="relative">
                       <select {...dReg('projectId', { required: true })} className="form-input h-[38px] text-sm appearance-none cursor-pointer">
                          <option value="">-- اختر المشروع الأساسي --</option>
                          {projectsList.filter(p => p.status === 'نشط' || p.status === 'مخطط له').map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                       </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-field space-y-1.5">
                      <label className="form-label tracking-tight">تاريخ التخصيص</label>
                      <input type="date" {...dReg('disbursementDate')} defaultValue={new Date().toISOString().split('T')[0]} className="form-input h-[38px] text-sm"/>
                    </div>
                    <div className="form-field space-y-1.5">
                      <label className="form-label tracking-tight">الكمية المقررة</label>
                      <input type="text" {...dReg('quantity')} placeholder="مثال: 2 وحدة" className="form-input h-[38px] text-sm"/>
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
                       {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تأكيد التخصيص'}
                    </button>
                    <button type="button" onClick={() => {setFoundFamily(null); setIsModalOpen(false); setHasSearched(false);}} className="btn btn-outline flex-1 h-[38px]">إلغاء</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {isExportModalOpen && (
        <div className="fixed inset-0 bg-[var(--secondary-500)]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsExportModalOpen(false)} className="absolute top-4 left-4 p-2 text-[var(--grey-400)] hover:text-[var(--secondary-500)] rounded-full transition-colors"><X className="w-5 h-5"/></button>
            
            <div className="mb-6">
               <h3 className="h6 text-[var(--secondary-500)] mb-1 flex items-center gap-2 tracking-tight">
                 <Download className="w-5 h-5 text-[var(--primary-500)]" /> تصدير البيانات
               </h3>
               <p className="body-4 text-[var(--grey-500)]">سيتم استخراج تخصيصات المساعدات المعروضة حالياً.</p>
            </div>
            
            <div className="space-y-5 mb-8">
              <div className="bg-[var(--primary-100)] rounded-lg p-4 flex items-center gap-3">
                 <div className="bg-[var(--white)] text-[var(--primary-500)] p-2 rounded-md shadow-sm border border-[var(--primary-200)]">
                   <FileSpreadsheet className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="caption font-semibold text-[var(--primary-600)]">إجمالي السجلات:</p>
                    <p className="body-2 font-bold text-[var(--primary-800)]">{filtered.length} <span className="caption font-normal">سجل</span></p>
                 </div>
              </div>

              <div className="form-field space-y-1.5">
                <label className="form-label tracking-tight">تسمية الملف</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={exportFileName}
                    onChange={(e) => setExportFileName(e.target.value)}
                    className="form-input pl-14 pr-3 py-2 text-sm h-[38px] w-full border-[var(--grey-300)]"
                    placeholder="أدخل اسم الملف..."
                    dir="rtl"
                  />
                  <span className="absolute left-3 top-2.5 caption font-semibold text-[var(--grey-500)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded border border-[var(--grey-200)]">.xlsx</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={performExport}
                className="btn btn-primary flex-1 h-[38px] whitespace-nowrap"
              >
                <Check className="w-[18px] h-[18px] mr-1.5"/> بدء التصدير 
              </button>
              <button onClick={() => setIsExportModalOpen(false)} className="btn btn-outline min-w-[100px] h-[38px]">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
