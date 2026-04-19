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
    <div className="bg-white rounded-xl shadow-[0_4px_24px_rgba(34,41,47,0.08)] flex flex-col h-[calc(100vh-8rem)] overflow-hidden">
      <div className="px-6 py-5 border-b border-[#E6E6E8] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#3D3B4A]">سجل العائلات</h2>
          <p className="text-[#A5A3AE] text-sm mt-1">إدارة بيانات المستفيدين ومتابعة ملفاتهم.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-[280px]">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-[#A5A3AE]" />
            <input 
              type="text" 
              placeholder="بحث..." 
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-3 pr-9 py-2 bg-white border border-[#DBDADE] rounded-md focus:border-[#7367F0] focus:shadow-[0_0_0_3px_rgba(115,103,240,0.15)] outline-none transition-all text-sm h-[38px] text-[#5D596C]"
            />
          </div>
          
          <div className="relative w-full sm:w-[220px]">
            <select 
              value={assigneeFilter}
              onChange={e => { setAssigneeFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 bg-white border border-[#DBDADE] rounded-md focus:border-[#7367F0] focus:shadow-[0_0_0_3px_rgba(115,103,240,0.15)] outline-none transition-all text-sm h-[38px] text-[#5D596C] appearance-none"
            >
              <option value="">تصفية حسب الجهة المكلفة</option>
              {assignees.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={handleOpenExportModal} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-[#7367F0] text-[#7367F0] font-medium rounded-md hover:bg-[#7367F0]/10 transition-colors h-[38px] text-sm whitespace-nowrap">
              <Download className="w-4 h-4" /> تصدير
            </button>
            <Link to="/families/new" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#7367F0] text-white font-medium rounded-md hover:bg-[#5E50EE] transition-colors shadow-sm h-[38px] text-sm whitespace-nowrap">
              <Plus className="w-4 h-4" /> إضافة عائلة
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto bg-white relative">
        <table className="w-full text-right whitespace-nowrap min-w-[800px]">
          <thead className="bg-[#F8F7FA] sticky top-0 z-20 shadow-sm">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider">اسم رب الأسرة</th>
              <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider">رقم الهوية</th>
              <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider">الجوال</th>
              <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider">الجهة المكلفة</th>
              <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider text-center">أفراد الأسرة</th>
              <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider text-center">التواجد الحالي</th>
              <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider text-center">الاستفادات</th>
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
                  <p className="text-sm font-medium">لا توجد بيانات مطابقة لبحثك</p>
                </div>
              </td></tr>
            ) : (
              paginatedData.map(f => (
                <tr key={f.id} className="hover:bg-[#7367F0]/[0.05] transition-colors even:bg-[#FAFAFA] h-[52px]">
                  <td className="px-6 py-2 font-medium text-[#7367F0]">{f.headFullName}</td>
                  <td className="px-6 py-2 text-sm text-[#5D596C]">{f.headIdentityNumber}</td>
                  <td className="px-6 py-2 text-sm font-mono text-[#5D596C]" dir="ltr">{f.mobileNumber || '-'}</td>
                  <td className="px-6 py-2 text-sm text-[#5D596C]">
                    <span className="bg-[#F4F5FA] px-2 py-1 rounded text-xs">{f.assigneeName}</span>
                  </td>
                  <td className="px-6 py-2 text-center text-sm text-[#5D596C]">
                    {f.memberCount + 1}
                  </td>
                  <td className="px-6 py-2 text-center">
                     <span className={`inline-flex px-2 py-0.5 rounded-full text-[13px] font-medium leading-5 ${f.region === 'شمال وادي غزة' ? 'bg-[#FFF0E1] text-[#FF9F43]' : f.region === 'جنوب وادي غزة' ? 'bg-[#E0F9FC] text-[#00CFE8]' : 'bg-[#E8F9F0] text-[#28C76F]'}`}>
                        {f.region || 'غير محدد'}
                     </span>
                  </td>
                  <td className="px-6 py-2 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[13px] font-medium leading-5 ${f.projectCount > 0 ? 'bg-[#F0EEFF] text-[#7367F0]' : 'bg-[#F4F5FA] text-[#A5A3AE]'}`}>
                      {f.projectCount}
                    </span>
                  </td>
                  <td className="px-6 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link to={`/families/${f.id}`} className="text-[#A5A3AE] hover:text-[#7367F0] transition-colors" title="عرض التفاصيل">
                        <Eye className="w-[18px] h-[18px]" />
                      </Link>
                      <Link to={`/families/${f.id}/edit`} className="text-[#A5A3AE] hover:text-[#28C76F] transition-colors" title="تعديل">
                        <Edit className="w-[18px] h-[18px]" />
                      </Link>
                      <button onClick={() => handleDelete(f.id, f.projectCount)} className="text-[#A5A3AE] hover:text-[#EA5455] transition-colors" title="حذف">
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
