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
    <div className="bg-white rounded-xl shadow-[0_4px_24px_rgba(34,41,47,0.08)] flex flex-col h-[calc(100vh-8rem)] overflow-hidden">
      <div className="px-6 py-5 border-b border-[#E6E6E8] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#3D3B4A]">سجل المشاريع</h2>
          <p className="text-[#A5A3AE] text-sm mt-1">إدارة المشاريع الإغاثية والجهات المانحة.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-[280px]">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-[#A5A3AE]" />
            <input 
              type="text" 
              placeholder="بحث باسم المشروع..." 
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-3 pr-9 py-2 bg-white border border-[#DBDADE] rounded-md focus:border-[#7367F0] focus:shadow-[0_0_0_3px_rgba(115,103,240,0.15)] outline-none transition-all text-sm h-[38px] text-[#5D596C]"
            />
          </div>
          
          <div className="relative w-full sm:w-[150px]">
            <select 
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 bg-white border border-[#DBDADE] rounded-md focus:border-[#7367F0] focus:shadow-[0_0_0_3px_rgba(115,103,240,0.15)] outline-none transition-all text-sm h-[38px] text-[#5D596C] appearance-none"
            >
              <option value="">كل الأنواع</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="relative w-full sm:w-[150px]">
            <select 
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 bg-white border border-[#DBDADE] rounded-md focus:border-[#7367F0] focus:shadow-[0_0_0_3px_rgba(115,103,240,0.15)] outline-none transition-all text-sm h-[38px] text-[#5D596C] appearance-none"
            >
              <option value="">كل الحالات</option>
              <option value="نشط">نشط</option>
              <option value="منتهي">منتهي</option>
            </select>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
             <button onClick={handleOpenExportModal} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-[#7367F0] text-[#7367F0] font-medium rounded-md hover:bg-[#7367F0]/10 transition-colors h-[38px] text-sm whitespace-nowrap">
              <Download className="w-4 h-4" /> تصدير
            </button>
            <Link to="/projects/new" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#7367F0] text-white font-medium rounded-md hover:bg-[#5E50EE] transition-colors shadow-sm h-[38px] text-sm whitespace-nowrap">
              <Plus className="w-4 h-4" /> إضافة مشروع
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto bg-white relative">
        <table className="w-full text-right whitespace-nowrap min-w-[900px]">
          <thead className="bg-[#F8F7FA] sticky top-0 z-20 shadow-sm">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider">اسم المشروع</th>
              <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider">دورية المشروع</th>
              <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider">نوع المساعدة</th>
              <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider">الجهة المانحة</th>
              <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider">تاريخ التنفيذ</th>
              <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider text-center">المستفيدين</th>
              <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider text-center">الحالة</th>
              <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E6E8]">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-20 text-[#A5A3AE]">
                 <div className="animate-pulse flex flex-col items-center gap-3">
                   <div className="w-8 h-8 rounded-full border-4 border-[#DBDADE] border-t-[#7367F0] animate-spin"></div>
                   <span className="text-sm font-medium">جاري تحميل البيانات...</span>
                 </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-20 text-[#A5A3AE]">
                <div className="flex flex-col items-center gap-2">
                  <Search className="w-8 h-8 opacity-50" />
                  <p className="text-sm font-medium">لا توجد مشاريع مسجلة</p>
                </div>
              </td></tr>
            ) : (
              paginatedData.map(p => (
                <tr key={p.id} className="hover:bg-[#7367F0]/[0.05] transition-colors even:bg-[#FAFAFA] h-[52px]">
                  <td className="px-6 py-2 font-medium text-[#7367F0]">{p.name}</td>
                  <td className="px-6 py-2 text-sm text-[#5D596C]">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[13px] font-medium ${p.projectType === 'لمرة واحدة' ? 'bg-[#FFF0E1] text-[#FF9F43]' : 'bg-[#F0EEFF] text-[#7367F0]'}`}>
                      {p.projectType || 'مستمر'}
                    </span>
                  </td>
                  <td className="px-6 py-2 text-sm text-[#5D596C]">{p.typeName}</td>
                  <td className="px-6 py-2 text-sm text-[#5D596C]">{p.sourceName}</td>
                  <td className="px-6 py-2 text-xs text-[#5D596C]">
                    <div>بدء: <span className="font-mono">{p.startDate}</span></div>
                    {p.endDate && <div>انتهاء: <span className="font-mono">{p.endDate}</span></div>}
                  </td>
                  <td className="px-6 py-2 text-center text-sm text-[#5D596C]">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[13px] font-medium ${p.beneficiariesCount > 0 ? 'bg-[#F0EEFF] text-[#7367F0]' : 'bg-[#F4F5FA] text-[#A5A3AE]'}`}>
                      {p.beneficiariesCount}
                    </span>
                  </td>
                  <td className="px-6 py-2 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[13px] font-medium
                      ${p.status === 'نشط' ? 'bg-[#E8F9F0] text-[#28C76F]' : 
                        p.status === 'منتهي' ? 'bg-[#F4F5FA] text-[#A5A3AE]' : 'bg-[#E0F9FC] text-[#00CFE8]'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link to={`/projects/${p.id}`} className="text-[#A5A3AE] hover:text-[#7367F0] transition-colors" title="عرض التفاصيل">
                        <Eye className="w-[18px] h-[18px]" />
                      </Link>
                      <Link to={`/projects/${p.id}/edit`} className="text-[#A5A3AE] hover:text-[#28C76F] transition-colors" title="تعديل">
                        <Edit className="w-[18px] h-[18px]" />
                      </Link>
                      <button onClick={() => handleDelete(p.id, p.beneficiariesCount)} className="text-[#A5A3AE] hover:text-[#EA5455] transition-colors" title="حذف">
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

      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-[#E6E6E8] gap-4">
         <span className="text-sm text-[#A5A3AE]">
            عرض {(currentPage - 1) * itemsPerPage + 1} إلى {Math.min(currentPage * itemsPerPage, filtered.length)} من أصل {filtered.length} إدخال
         </span>
         <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded bg-[#F4F5FA] text-[#A5A3AE] text-sm hover:bg-[#7367F0] hover:text-white disabled:opacity-50 transition-colors">السابق</button>
            <button className="px-3 py-1.5 rounded bg-[#7367F0] text-white text-sm font-medium">{currentPage}</button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded bg-[#F4F5FA] text-[#A5A3AE] text-sm hover:bg-[#7367F0] hover:text-white disabled:opacity-50 transition-colors">التالي</button>
         </div>
      </div>

      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 md:p-8 w-full max-w-md shadow-[0_4px_24px_rgba(0,0,0,0.15)] relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsExportModalOpen(false)} className="absolute top-4 left-4 p-2 text-[#A5A3AE] hover:text-[#3D3B4A] rounded-full transition-colors"><X className="w-5 h-5"/></button>
            
            <div className="mb-6">
               <h3 className="text-lg font-bold text-[#3D3B4A] mb-1 flex items-center gap-2">
                 <Download className="w-5 h-5 text-[#7367F0]" /> تصدير البيانات
               </h3>
               <p className="text-sm text-[#A5A3AE]">سيتم استخراج البيانات المعروضة حالياً.</p>
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
