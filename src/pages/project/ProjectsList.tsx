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
    <div className="bg-white rounded-3xl shadow-[0_2px_20px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500 overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">سجل المشاريع</h2>
          <p className="text-slate-500 text-sm mt-1">إدارة المشاريع الإغاثية والجهات المانحة.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={handleOpenExportModal} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-100 transition-colors">
            <Download className="w-4 h-4" /> تصدير Excel
          </button>
          <Link to="/projects/new" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md">
            <Plus className="w-4 h-4" /> إضافة مشروع
          </Link>
        </div>
      </div>

      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 bg-white">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute right-4 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="بحث باسم المشروع..." 
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
          />
        </div>
        <div className="w-full sm:w-48 relative">
          <Filter className="w-4 h-4 absolute right-4 top-3.5 text-slate-400" />
          <select 
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="w-full pl-4 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium appearance-none"
          >
            <option value="">كل الأنواع</option>
            {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="w-full sm:w-48 relative">
          <Filter className="w-4 h-4 absolute right-4 top-3.5 text-slate-400" />
          <select 
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="w-full pl-4 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium appearance-none"
          >
            <option value="">كل الحالات</option>
            <option value="نشط">نشط</option>
            <option value="منتهي">منتهي</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white relative">
        <table className="w-full text-right text-sm whitespace-nowrap">
          <thead className="bg-slate-100 text-slate-700 font-extrabold sticky top-0 z-20 shadow-sm border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">اسم المشروع</th>
              <th className="px-6 py-4">دورية المشروع</th>
              <th className="px-6 py-4">نوع المساعدة</th>
              <th className="px-6 py-4">الجهة المانحة</th>
              <th className="px-6 py-4">تاريخ التنفيذ</th>
              <th className="px-6 py-4 text-center">المستفيدين</th>
              <th className="px-6 py-4 text-center">الحالة</th>
              <th className="px-6 py-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 relative z-0">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-20 text-slate-500">
                 <div className="animate-pulse flex flex-col items-center gap-3">
                   <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-purple-600 animate-spin"></div>
                   <span>جاري تحميل البيانات...</span>
                 </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-20 text-slate-400">
                <div className="flex flex-col items-center gap-2">
                  <Search className="w-8 h-8 opacity-50" />
                  <p>لا توجد مشاريع مسجلة</p>
                </div>
              </td></tr>
            ) : (
              paginatedData.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-5 font-bold text-slate-800">{p.name}</td>
                  <td className="px-6 py-5 text-slate-600 font-medium whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${p.projectType === 'لمرة واحدة' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {p.projectType || 'مستمر'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-slate-600 font-medium">{p.typeName}</td>
                  <td className="px-6 py-5 text-slate-600">{p.sourceName}</td>
                  <td className="px-6 py-5 text-slate-500 text-xs">
                    <div>بدء: <span className="font-mono">{p.startDate}</span></div>
                    {p.endDate && <div>انتهاء: <span className="font-mono">{p.endDate}</span></div>}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex min-w-[2rem] items-center justify-center px-2 py-1 rounded-md text-xs font-bold ${p.beneficiariesCount > 0 ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                      {p.beneficiariesCount}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold
                      ${p.status === 'نشط' ? 'bg-emerald-100 text-emerald-700' : 
                        p.status === 'منتهي' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-row-reverse items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDelete(p.id, p.beneficiariesCount)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link to={`/projects/${p.id}/edit`} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="تعديل">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <Link to={`/projects/${p.id}`} className="p-2 text-slate-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors" title="عرض التفاصيل">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
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

      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsExportModalOpen(false)} className="absolute top-6 left-6 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            
            <div className="mb-6">
               <h3 className="text-xl font-extrabold text-slate-800 mb-1 flex items-center gap-2">
                 <Download className="w-5 h-5 text-emerald-600" /> تصدير البيانات
               </h3>
               <p className="text-sm text-slate-500">سيتم استخراج البيانات المعروضة حالياً.</p>
            </div>
            
            <div className="space-y-5 mb-8">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                 <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                   <FileSpreadsheet className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-emerald-800">إجمالي المشاريع:</p>
                    <p className="text-xl font-black text-emerald-700">{filtered.length} <span className="text-sm font-medium">مشروع</span></p>
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
