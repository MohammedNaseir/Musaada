import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { familiesService, familyProjectService, assigneesService, importService } from '../../services';
import { Family, Assignee } from '../../models/types';
import { Search, Plus, Download, Eye, Edit, Trash2, Filter, X, Check, FileSpreadsheet, Upload, Loader2, AlertTriangle } from 'lucide-react';
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

  // Import Modal states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<import('../../services').ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

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

  const handleImport = async () => {
    if (!importFile) return;
    setIsImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      const result = await importService.importExcel(importFile);
      setImportResult(result);
      await loadData();
    } catch (err: any) {
      setImportError(err.message || 'حدث خطأ أثناء الاستيراد');
    } finally {
      setIsImporting(false);
    }
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
    <div className="card flex flex-col h-[calc(100vh-8rem)] overflow-hidden p-0">
      <div className="card-header pb-0 border-b-0 px-6 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="card-title">سجل العائلات</h2>
          <p className="body-3 text-[var(--grey-600)] mt-1">إدارة بيانات المستفيدين ومتابعة ملفاتهم.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-[280px]">
            <Search className="w-4 h-4 absolute right-3 top-3.5 text-[var(--grey-500)]" />
            <input 
              type="text" 
              placeholder="بحث بالحقول الرئيسية..." 
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="form-input w-full pl-3 pr-9 py-2"
            />
          </div>
          
          <div className="relative w-full sm:w-[220px]">
            <select 
              value={assigneeFilter}
              onChange={e => { setAssigneeFilter(e.target.value); setCurrentPage(1); }}
              className="form-input w-full px-3 py-2 appearance-none"
            >
              <option value="">تصفية حسب الجهة المكلفة</option>
              {assignees.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => { setIsImportModalOpen(true); setImportResult(null); setImportError(null); setImportFile(null); }} className="btn btn-outline btn-small flex-1 sm:flex-none whitespace-nowrap">
              <Upload className="w-4 h-4" /> استيراد
            </button>
            <button onClick={handleOpenExportModal} className="btn btn-outline btn-small flex-1 sm:flex-none whitespace-nowrap">
              <Download className="w-4 h-4" /> تصدير
            </button>
            <Link to="/families/new" className="btn btn-primary btn-small flex-1 sm:flex-none whitespace-nowrap">
              <Plus className="w-4 h-4" /> إضافة عائلة
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto bg-[var(--white)] relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--white)] z-10 transition-opacity">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-[var(--primary-200)] border-t-[var(--primary-500)] rounded-full animate-spin"></div>
              <p className="body-3 text-[var(--secondary-400)]">جاري تحميل البيانات...</p>
            </div>
          </div>
        ) : (
          <table className="table min-w-[1000px] rounded-none shadow-none mt-2">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="w-14 text-center">#</th>
                <th>رقم الهوية</th>
                <th>اسم رب الأسرة</th>
                <th>رقم الجوال</th>
                <th>الحالة والمكان</th>
                <th className="text-center">عدد الأفراد</th>
                <th>المكلف بالشؤون</th>
                <th className="text-center">المساعدات</th>
                <th className="text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-[var(--grey-500)] py-12 font-medium">لا توجد عائلات تطابق بحثك...</td>
                </tr>
              ) : (
                paginatedData.map((f, i) => (
                  <tr key={f.id}>
                    <td className="text-center text-[var(--secondary-400)] font-medium">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                    <td className="font-mono text-[var(--secondary-500)]">{f.headIdentityNumber}</td>
                    <td className="font-bold text-[var(--secondary-500)]">{f.headFullName}</td>
                    <td className="font-mono text-[var(--secondary-400)]" dir="ltr">{f.mobileNumber || '-'}</td>
                    <td>
                      <div className="flex flex-col gap-1.5">
                        <span className="body-4 text-[var(--secondary-500)] break-words max-w-[150px]">{f.currentResidence}</span>
                        <div className="flex gap-1 flex-wrap">
                          {f.isDisplaced ? (
                            <span className="badge badge-warning text-[10px] py-0 px-2 rounded-md">نازح</span>
                          ) : (
                            <span className="badge badge-success text-[10px] py-0 px-2 rounded-md">مقيم</span>
                          )}
                          <span className="badge badge-neutral text-[10px] py-0 px-2 rounded-md">{f.region || 'غير محدد'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full text-xs font-bold bg-[var(--primary-100)] text-[var(--primary-600)]">
                        {f.memberCount + 1}
                      </span>
                    </td>
                    <td>
                      {f.assigneeId ? (
                         <span className="badge badge-primary text-xs max-w-[150px] truncate block" title={f.assigneeName}>{f.assigneeName}</span>
                      ) : (
                         <span className="badge badge-neutral text-xs">غير محدد</span>
                      )}
                    </td>
                    <td className="text-center">
                      <span className={`inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-bold ${
                        f.projectCount > 0 ? 'bg-[var(--tertiary-100)] text-[var(--tertiary-500)]' : 'bg-[var(--grey-100)] text-[var(--grey-500)]'
                      }`}>
                        {f.projectCount}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <Link to={`/families/${f.id}`} className="text-[var(--secondary-300)] hover:text-[var(--primary-500)] p-1.5 rounded-md hover:bg-[var(--primary-100)] transition-colors" title="عرض التفاصيل">
                           <Eye className="w-[18px] h-[18px]" />
                        </Link>
                        <Link to={`/families/${f.id}/edit`} className="text-[var(--secondary-300)] hover:text-[var(--tertiary-500)] p-1.5 rounded-md hover:bg-[var(--tertiary-100)] transition-colors" title="تعديل البيانات">
                           <Edit className="w-[18px] h-[18px]" />
                        </Link>
                        <button 
                           onClick={() => handleDelete(f.id, f.projectCount)}
                           disabled={f.projectCount > 0}
                           className="text-[var(--secondary-300)] hover:text-[var(--alert-danger-500)] p-1.5 rounded-md hover:bg-[var(--alert-danger-100)] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--secondary-300)] transition-colors"
                           title={f.projectCount > 0 ? 'لا يمكن الحذف لارتباطها بمساعدات' : 'حذف'}
                        >
                           <Trash2 className="w-[18px] h-[18px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="px-6 py-4 border-t border-[var(--grey-200)] flex items-center justify-between bg-[var(--bg-tertiary)]">
        <span className="body-3 text-[var(--secondary-400)]">
          إجمالي النتائج: <strong className="text-[var(--secondary-500)] font-bold">{filtered.length}</strong> عائلة
        </span>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-pagination h-8"
            >
              السابق
            </button>
            <span className="text-xs font-extrabold text-[var(--secondary-500)] px-3 bg-[var(--white)] py-1.5 flex items-center rounded-lg border border-[var(--grey-200)] shadow-sm">
              صفحة {currentPage} من {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-pagination h-8"
            >
              التالي
            </button>
          </div>
        )}
      </div>

      {isExportModalOpen && (
        <div className="fixed inset-0 bg-[var(--secondary-500)]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-sm" dir="rtl">
            <div className="card-header border-b-0 pb-0 flex justify-between items-center mb-4">
              <h3 className="h6 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[var(--alert-success-500)]" />
                تصدير إلى Excel
              </h3>
              <button onClick={() => setIsExportModalOpen(false)} className="text-[var(--grey-500)] hover:text-[var(--secondary-500)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="form-field mb-6">
              <label className="form-label text-[var(--secondary-500)] mb-2">اسم الملف:</label>
              <input 
                type="text" 
                value={exportFileName}
                onChange={e => setExportFileName(e.target.value)}
                className="form-input w-full"
                autoFocus
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-4">
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="btn btn-outline"
              >
                إلغاء
              </button>
              <button 
                onClick={performExport}
                className="btn btn-primary"
              >
                <Download className="w-4 h-4 ml-2" />
                تصدير الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 bg-[var(--secondary-500)]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md" dir="rtl">
            <div className="card-header border-b-0 pb-0 flex justify-between items-center mb-4">
              <h3 className="h6 flex items-center gap-2">
                <Upload className="w-5 h-5 text-[var(--primary-500)]" />
                استيراد من Excel
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-[var(--grey-500)] hover:text-[var(--secondary-500)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!importResult && !importError && (
              <>
                <div className="form-field mb-4">
                  <label className="form-label text-[var(--secondary-500)] mb-2">اختر ملف Excel (.xlsx):</label>
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={e => setImportFile(e.target.files?.[0] || null)}
                    className="form-input w-full text-sm"
                  />
                </div>
                <p className="body-4 text-[var(--grey-500)] mb-4">
                  يتم قراءة البيانات من الصف الرابع. الصفوف التي تحتوي "شهيد" أو "شهداء" في الحالة الاجتماعية يتم تخطيها تلقائياً.
                </p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setIsImportModalOpen(false)} className="btn btn-outline">إلغاء</button>
                  <button
                    onClick={handleImport}
                    disabled={!importFile || isImporting}
                    className="btn btn-primary disabled:opacity-50"
                  >
                    {isImporting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> جاري الاستيراد...</>
                    ) : (
                      <><Upload className="w-4 h-4" /> استيراد</>
                    )}
                  </button>
                </div>
              </>
            )}

            {importError && (
              <div className="alert alert-danger mb-4">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importResult && (
              <div className="space-y-3">
                <div className="alert alert-success">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-bold">تم الاستيراد بنجاح!</p>
                    <ul className="body-4 mt-1 space-y-1">
                      <li>العائلات المضافة: <strong>{importResult.familiesCreated}</strong></li>
                      <li>أفراد الزوج/ة المضافة: <strong>{importResult.membersCreated}</strong></li>
                      <li>الجهات المكلفة الجديدة: <strong>{importResult.assigneesCreated}</strong></li>
                      {importResult.skippedMartyrs > 0 && <li>صفوف الشهداء المتخطاة: <strong>{importResult.skippedMartyrs}</strong></li>}
                      {importResult.skippedEmptyIdentity > 0 && <li>صفوف بدون رقم هوية متخطاة: <strong>{importResult.skippedEmptyIdentity}</strong></li>}
                    </ul>
                  </div>
                </div>
                <button onClick={() => setIsImportModalOpen(false)} className="btn btn-primary w-full">إغلاق</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
