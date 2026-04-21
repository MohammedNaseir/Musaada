import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsService, assistanceTypesService, sourcesService, familyProjectService } from '../../services';
import { Project, AssistanceType, Source } from '../../models/types';
import { Search, Plus, Filter, Download, Eye, Edit, Trash2, X, Check, FileSpreadsheet } from 'lucide-react';
import { exportToExcel } from '../../utils/export';

export default function ProjectsList() {
  const [projects, setProjects] = useState<(Project & { typeName: string, sourceName: string, beneficiariesCount: number })[]>([]);
  const [types, setTypes] = useState<AssistanceType[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

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
    const [allProjects, allTypes, allSources, allDisb] = await Promise.all([
      projectsService.getAll(),
      assistanceTypesService.getAll(),
      sourcesService.getAll(),
      familyProjectService.getAll()
    ]);
    
    setTypes(allTypes);
    setSources(allSources);

    const enriched = allProjects.map(p => {
      const typeName = allTypes.find(t => t.id === p.assistanceTypeId)?.name || 'غير محدد';
      const sourceName = allSources.find(s => s.id === p.sourceId)?.name || 'غير محدد';
      const bCount = allDisb.filter(d => d.projectId === p.id).length;
      return { ...p, typeName, sourceName, beneficiariesCount: bCount };
    });
    
    setProjects(enriched);
    setLoading(false);
  };

  const handleDelete = async (id: number, bCount: number) => {
    if (bCount > 0) {
      alert('لا يمكن حذف مشروع تم تخصيصه لعائلات. الرجاء حذف ارتباط العائلات أولا.');
      return;
    }
    if (window.confirm('هل أنت متأكد من الحذف؟')) {
      await projectsService.delete(id);
      loadData();
    }
  };

  const filtered = projects.filter(p => {
    const matchesSearch = p.name.includes(searchTerm);
    const matchesStatus = statusFilter ? p.status === statusFilter : true;
    const matchesType = typeFilter ? p.assistanceTypeId?.toString() === typeFilter : true;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleOpenExportModal = () => {
    const today = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    
    let baseName = 'المشاريع';
    if (searchTerm) {
      baseName += `_بحث_${searchTerm}`;
    }
    if (statusFilter) {
      baseName += `_${statusFilter}`;
    }
    
    setExportFileName(`${baseName}_${today}`);
    setIsExportModalOpen(true);
  };

  const performExport = () => {
    const dataToExport = filtered.map(p => ({
      'المشروع': p.name,
      'نوع المساعدة': p.typeName,
      'تصنيف المشروع': p.projectType || 'مستمر',
      'الجهة المانحة': p.sourceName,
      'تاريخ البدء': p.startDate,
      'تاريخ الانتهاء': p.endDate || '-',
      'الحالة': p.status,
      'عدد المستفيدين': p.beneficiariesCount
    }));
    const fileName = exportFileName.trim() ? exportFileName.trim() : 'المشاريع';
    exportToExcel(dataToExport, fileName);
    setIsExportModalOpen(false);
  };

  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <div className="card p-0 flex flex-col h-[calc(100vh-8rem)] overflow-hidden">
      <div className="card-header border-b border-[var(--grey-200)] px-6 py-5 mb-0 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="card-title">سجل المشاريع</h2>
          <p className="card-subtitle mt-1">إدارة المشاريع الإغاثية والجهات المانحة.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-[280px]">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-[var(--grey-400)]" />
            <input 
              type="text" 
              placeholder="بحث باسم المشروع..." 
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="form-input pl-3 pr-9 py-2 text-sm h-[38px] w-full"
            />
          </div>
          
          <div className="relative w-full sm:w-[150px]">
            <select 
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="form-input px-3 py-2 text-sm h-[38px] w-full appearance-none"
            >
              <option value="">كل الأنواع</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="relative w-full sm:w-[150px]">
            <select 
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="form-input px-3 py-2 text-sm h-[38px] w-full appearance-none"
            >
              <option value="">كل الحالات</option>
              <option value="نشط">نشط</option>
              <option value="منتهي">منتهي</option>
            </select>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
             <button onClick={handleOpenExportModal} className="btn btn-outline flex-1 sm:flex-none h-[38px] whitespace-nowrap">
              <Download className="w-4 h-4 mr-2" /> تصدير
            </button>
            <Link to="/projects/new" className="btn btn-primary flex-1 sm:flex-none h-[38px] whitespace-nowrap">
              <Plus className="w-4 h-4 mr-2" /> إضافة مشروع
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto relative">
        <table className="table min-w-[900px]">
          <thead className="sticky top-0 z-20">
            <tr>
              <th>اسم المشروع</th>
              <th>دورية المشروع</th>
              <th>نوع المساعدة</th>
              <th>الجهة المانحة</th>
              <th>تاريخ التنفيذ</th>
              <th className="text-center">المستفيدين</th>
              <th className="text-center">الحالة</th>
              <th className="text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-20 text-[var(--grey-500)]">
                 <div className="animate-pulse flex flex-col items-center gap-3">
                   <div className="w-8 h-8 rounded-full border-4 border-[var(--grey-200)] border-t-[var(--primary-500)] animate-spin"></div>
                   <span className="text-sm font-medium">جاري تحميل البيانات...</span>
                 </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-20 text-[var(--grey-500)]">
                <div className="flex flex-col items-center gap-2">
                  <Search className="w-8 h-8 opacity-50" />
                  <p className="text-sm font-medium">لا توجد مشاريع مسجلة</p>
                </div>
              </td></tr>
            ) : (
              paginatedData.map(p => (
                <tr key={p.id}>
                  <td className="font-medium text-[var(--primary-500)]">{p.name}</td>
                  <td>
                    <span className={`badge ${p.projectType === 'لمرة واحدة' ? 'badge-warning' : 'badge-primary'}`}>
                      {p.projectType || 'مستمر'}
                    </span>
                  </td>
                  <td className="text-[var(--secondary-500)]">{p.typeName}</td>
                  <td className="text-[var(--secondary-500)]">{p.sourceName}</td>
                  <td className="font-mono text-[var(--secondary-500)] text-xs">
                    <div>بدء: <span className="font-medium ml-1">{p.startDate}</span></div>
                    {p.endDate && <div>انتهاء: <span className="font-medium ml-1">{p.endDate}</span></div>}
                  </td>
                  <td className="text-center">
                    <span className={`badge ${p.beneficiariesCount > 0 ? 'badge-primary' : 'bg-[var(--bg-tertiary)] text-[var(--grey-500)]'}`}>
                      {p.beneficiariesCount}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`badge ${
                      p.status === 'نشط' ? 'badge-success' : 
                        p.status === 'منتهي' ? 'badge-muted' : 'badge-info'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link to={`/projects/${p.id}`} className="text-[var(--grey-400)] hover:text-[var(--primary-500)] transition-colors p-1" title="عرض التفاصيل">
                        <Eye className="w-[18px] h-[18px]" />
                      </Link>
                      <Link to={`/projects/${p.id}/edit`} className="text-[var(--grey-400)] hover:text-[var(--alert-success-500)] transition-colors p-1" title="تعديل">
                        <Edit className="w-[18px] h-[18px]" />
                      </Link>
                      <button onClick={() => handleDelete(p.id, p.beneficiariesCount)} className="text-[var(--grey-400)] hover:text-[var(--alert-danger-500)] transition-colors p-1" title="حذف">
                        <Trash2 className="w-[18px] h-[18px]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-[var(--grey-200)] gap-4 bg-[var(--white)]">
         <span className="body-4 text-[var(--grey-500)]">
            عرض {(currentPage - 1) * itemsPerPage + 1} إلى {Math.min(currentPage * itemsPerPage, filtered.length)} من أصل {filtered.length} إدخال
         </span>
         <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-pagination">السابق</button>
            <button className="btn-pagination-active">{currentPage}</button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn-pagination">التالي</button>
         </div>
      </div>

      {isExportModalOpen && (
        <div className="fixed inset-0 bg-[var(--secondary-500)]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsExportModalOpen(false)} className="absolute top-4 left-4 p-2 text-[var(--grey-400)] hover:text-[var(--secondary-500)] rounded-full transition-colors"><X className="w-5 h-5"/></button>
            
            <div className="mb-6">
               <h3 className="h6 text-[var(--secondary-500)] mb-1 flex items-center gap-2 tracking-tight">
                 <Download className="w-5 h-5 text-[var(--primary-500)]" /> تصدير البيانات
               </h3>
               <p className="body-4 text-[var(--grey-500)]">سيتم استخراج البيانات المعروضة حالياً.</p>
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
