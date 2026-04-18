import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { familiesService, familyProjectService, assigneesService } from '../../services';
import { Family, Assignee } from '../../models/types';
import { Search, Plus, Download, Eye, Edit, Trash2, Filter, X, Check, FileSpreadsheet } from 'lucide-react';
import { exportToExcel } from '../../utils/export';

export default function FamiliesList() {
  const [families, setFamilies] = useState<(Family & { projectCount: number, assigneeName: string })[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  
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
    const [allFamilies, allDisbursements, allAssignees] = await Promise.all([
      familiesService.getAll(),
      familyProjectService.getAll(),
      assigneesService.getAll()
    ]);
    
    setAssignees(allAssignees);

    const enriched = allFamilies.map(f => {
      const pCount = allDisbursements.filter(d => d.familyId === f.id).length;
      const aName = allAssignees.find(a => a.id === f.assigneeId)?.name || 'غير محدد';
      return { ...f, projectCount: pCount, assigneeName: aName };
    });
    
    setFamilies(enriched);
    setLoading(false);
  };

  const handleDelete = async (id: number, projectCount: number) => {
    if (projectCount > 0) {
      alert('لا يمكن حذف عائلة تمتلك ملف مساعدات مخصص لها.');
      return;
    }
    if (window.confirm('هل أنت متأكد من الحذف؟')) {
      await familiesService.delete(id);
      loadData();
    }
  };

  const filtered = families.filter(f => {
    const matchesSearch = 
      f.headFullName.includes(searchTerm) || 
      f.headIdentityNumber.includes(searchTerm) || 
      (f.mobileNumber || '').includes(searchTerm);
    
    const matchesAssignee = assigneeFilter ? f.assigneeId?.toString() === assigneeFilter : true;
    
    return matchesSearch && matchesAssignee;
  });

  const handleOpenExportModal = () => {
    const today = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    
    let baseName = 'العائلات_المستفيدة';
    if (searchTerm) {
      baseName += `_بحث_${searchTerm}`;
    }
    if (assigneeFilter) {
      const aName = assignees.find(a => a.id.toString() === assigneeFilter)?.name;
      if (aName) baseName += `_المكلف_${aName}`;
    }
    
    setExportFileName(`${baseName}_${today}`);
    setIsExportModalOpen(true);
  };

  const performExport = () => {
    const dataToExport = filtered.map(f => ({
      'الهوية': f.headIdentityNumber,
      'اسم رب الأسرة': f.headFullName,
      'رقم الجوال': f.mobileNumber || '',
      'السكن الحالي': f.currentResidence,
      'منطقة النزوح': f.region || 'غير محدد',
      'حالة النزوح': f.isDisplaced ? 'نازح' : 'مقيم',
      'عدد الأفراد': f.memberCount + 1,
      'المكلف': f.assigneeName,
      'المساعدات المخصصة': f.projectCount
    }));

    const fileName = exportFileName.trim() ? exportFileName.trim() : 'العائلات_المستفيدة';
    exportToExcel(dataToExport, fileName);
    setIsExportModalOpen(false);
  };

  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <div className="bg-white rounded-3xl shadow-[0_2px_20px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500 overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">سجل العائلات</h2>
          <p className="text-slate-500 text-sm mt-1">إدارة بيانات المستفيدين ومتابعة ملفاتهم.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={handleOpenExportModal} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-100 transition-colors">
            <Download className="w-4 h-4" /> تصدير Excel
          </button>
          <Link to="/families/new" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md">
            <Plus className="w-4 h-4" /> إضافة عائلة
          </Link>
        </div>
      </div>

      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 bg-white">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute right-4 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="بحث بالاسم، الهوية، أو رقم الجوال..." 
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
          />
        </div>
        <div className="w-full sm:w-64 relative">
          <Filter className="w-4 h-4 absolute right-4 top-3.5 text-slate-400" />
          <select 
            value={assigneeFilter}
            onChange={e => { setAssigneeFilter(e.target.value); setCurrentPage(1); }}
            className="w-full pl-4 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium appearance-none"
          >
            <option value="">تصفية حسب الجهة المكلفة</option>
            {assignees.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white relative">
        <table className="w-full text-right text-sm whitespace-nowrap">
          <thead className="bg-slate-100 text-slate-700 font-extrabold sticky top-0 z-20 shadow-sm border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">اسم رب الأسرة</th>
              <th className="px-6 py-4">رقم الهوية</th>
              <th className="px-6 py-4">الجوال</th>
              <th className="px-6 py-4">الجهة المكلفة</th>
              <th className="px-6 py-4 text-center">أفراد الأسرة</th>
              <th className="px-6 py-4 text-center">التواجد الحالي</th>
              <th className="px-6 py-4 text-center">مرات الاستفادة</th>
              <th className="px-6 py-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 relative z-0">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-20 text-slate-500">
                 <div className="animate-pulse flex flex-col items-center gap-3">
                   <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
                   <span>جاري تحميل البيانات...</span>
                 </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-20 text-slate-400">
                <div className="flex flex-col items-center gap-2">
                  <Search className="w-8 h-8 opacity-50" />
                  <p>لا توجد بيانات مطابقة لبحثك</p>
                </div>
              </td></tr>
            ) : (
              paginatedData.map(f => (
                <tr key={f.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-5 font-bold text-slate-800">{f.headFullName}</td>
                  <td className="px-6 py-5 font-mono text-slate-600 tracking-tight">{f.headIdentityNumber}</td>
                  <td className="px-6 py-5 font-mono text-slate-600 tracking-tight" dir="ltr">{f.mobileNumber || '-'}</td>
                  <td className="px-6 py-5 text-slate-500 font-medium">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-md text-xs">{f.assigneeName}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="font-bold text-slate-700">{f.memberCount + 1}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                     <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold ${f.region === 'شمال وادي غزة' ? 'bg-orange-100 text-orange-700' : f.region === 'جنوب وادي غزة' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                        {f.region || 'غير محدد'}
                     </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex min-w-[2rem] items-center justify-center px-2 py-1 rounded-md text-xs font-bold ${f.projectCount > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                      {f.projectCount}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-row-reverse items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDelete(f.id, f.projectCount)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link to={`/families/${f.id}/edit`} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="تعديل">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <Link to={`/families/${f.id}`} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="عرض التفاصيل">
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
