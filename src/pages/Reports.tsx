import { useState, useEffect } from 'react';
import { familiesService, familyProjectService, projectsService, assigneesService, assistanceTypesService, sourcesService } from '../services';
import { Family, FamilyProject, Project, Assignee, AssistanceType, Source } from '../models/types';
import { Download, Users, Folder, FolderHeart, FolderX, User, FilterX, Zap, ChevronUp, ChevronDown, Check, X, CheckSquare, Square, Settings2, Sparkles } from 'lucide-react';
import { exportToExcel } from '../utils/export';

interface AdvancedFilters {
  assigneeId: string;
  memberCountMin: string;
  memberCountMax: string;
  region: string;
  projectsCountMin: string;
  projectsCountMax: string;
  projectId: string;
  assistanceTypeId: string;
  sourceId: string;
  lastDisbursementFrom: string;
  lastDisbursementTo: string;
  maritalStatus: string;
}

const defaultFilters: AdvancedFilters = {
  assigneeId: 'all',
  memberCountMin: '',
  memberCountMax: '',
  region: 'all',
  projectsCountMin: '',
  projectsCountMax: '',
  projectId: 'all',
  assistanceTypeId: 'all',
  sourceId: 'all',
  lastDisbursementFrom: '',
  lastDisbursementTo: '',
  maritalStatus: 'all',
};

const AVAILABLE_COLUMNS = [
  { id: 'headFullName', label: 'اسم رب الأسرة' },
  { id: 'headIdentityNumber', label: 'رقم الهوية' },
  { id: 'mobileNumber', label: 'رقم الجوال' },
  { id: 'memberCount', label: 'عدد الأفراد' },
  { id: 'region', label: 'السكن الحالي' },
  { id: 'assignee', label: 'المكلف' },
  { id: 'projectsCount', label: 'مرات الاستفادة' },
  { id: 'lastDisbursement', label: 'تاريخ آخر صرف' },
];

export default function Reports() {
  const [loading, setLoading] = useState(true);

  // Data states
  const [families, setFamilies] = useState<Family[]>([]);
  const [familyProjects, setFamilyProjects] = useState<FamilyProject[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [assistanceTypes, setAssistanceTypes] = useState<AssistanceType[]>([]);
  const [sources, setSources] = useState<Source[]>([]);

  // Filter & Display states
  const [filters, setFilters] = useState<AdvancedFilters>(defaultFilters);
  const [filteredData, setFilteredData] = useState<Family[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(AVAILABLE_COLUMNS.map(c => c.id));
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
    const [fams, famProjs, projs, assigns, types, srcs] = await Promise.all([
      familiesService.getAll(),
      familyProjectService.getAll(),
      projectsService.getAll(),
      assigneesService.getAll(),
      assistanceTypesService.getAll(),
      sourcesService.getAll()
    ]);
    setFamilies(fams);
    setFamilyProjects(famProjs);
    setProjects(projs);
    setAssignees(assigns);
    setAssistanceTypes(types);
    setSources(srcs);
    setLoading(false);
  };

  useEffect(() => {
    if (!loading) {
      const handler = setTimeout(() => {
        handleApplyFilters(filters);
      }, 400); // Debounce
      return () => clearTimeout(handler);
    }
  }, [filters, loading]);

  const getFamilyProjectCount = (familyId: number) => {
    return familyProjects.filter(fp => fp.familyId === familyId).length;
  };

  const getAssigneeName = (id?: number) => {
    if (!id) return 'غير محدد';
    return assignees.find(a => a.id === id)?.name || 'غير محدد';
  };

  const getFamilyLastDisbursement = (familyId: number) => {
    const fps = familyProjects.filter(fp => fp.familyId === familyId);
    if (fps.length === 0) return null;
    return fps.sort((a, b) => new Date(b.disbursementDate).getTime() - new Date(a.disbursementDate).getTime())[0].disbursementDate;
  };

  const handleApplyFilters = (currentFilters = filters) => {
    let result = families;
    if (!families.length) return;

    if (currentFilters.assigneeId !== 'all') {
      if (currentFilters.assigneeId === 'none') result = result.filter(f => !f.assigneeId);
      else result = result.filter(f => f.assigneeId === Number(currentFilters.assigneeId));
    }

    const mMin = parseInt(currentFilters.memberCountMin);
    if (!isNaN(mMin)) result = result.filter(f => (f.memberCount + 1) >= mMin);
    const mMax = parseInt(currentFilters.memberCountMax);
    if (!isNaN(mMax)) result = result.filter(f => (f.memberCount + 1) <= mMax);

    if (currentFilters.region !== 'all') {
      result = result.filter(f => f.region === currentFilters.region);
    }

    const pMin = parseInt(currentFilters.projectsCountMin);
    if (!isNaN(pMin)) result = result.filter(f => getFamilyProjectCount(f.id) >= pMin);
    const pMax = parseInt(currentFilters.projectsCountMax);
    if (!isNaN(pMax)) result = result.filter(f => getFamilyProjectCount(f.id) <= pMax);

    if (currentFilters.projectId !== 'all') {
      const pId = Number(currentFilters.projectId);
      const familyIdsInProject = familyProjects.filter(fp => fp.projectId === pId).map(fp => fp.familyId);
      result = result.filter(f => familyIdsInProject.includes(f.id));
    }

    if (currentFilters.assistanceTypeId !== 'all') {
      const tId = Number(currentFilters.assistanceTypeId);
      const projIds = projects.filter(p => p.assistanceTypeId === tId).map(p => p.id);
      const familyIds = familyProjects.filter(fp => projIds.includes(fp.projectId)).map(fp => fp.familyId);
      result = result.filter(f => familyIds.includes(f.id));
    }

    if (currentFilters.sourceId !== 'all') {
      const sId = Number(currentFilters.sourceId);
      const projIds = projects.filter(p => p.sourceId === sId).map(p => p.id);
      const familyIds = familyProjects.filter(fp => projIds.includes(fp.projectId)).map(fp => fp.familyId);
      result = result.filter(f => familyIds.includes(f.id));
    }

    if (currentFilters.lastDisbursementFrom) {
       result = result.filter(f => {
         const lastDate = getFamilyLastDisbursement(f.id);
         return lastDate && new Date(lastDate) >= new Date(currentFilters.lastDisbursementFrom);
       });
    }
    if (currentFilters.lastDisbursementTo) {
       result = result.filter(f => {
         const lastDate = getFamilyLastDisbursement(f.id);
         return lastDate && new Date(lastDate) <= new Date(currentFilters.lastDisbursementTo);
       });
    }

    if (currentFilters.maritalStatus !== 'all') {
      result = result.filter(f => f.maritalStatus === currentFilters.maritalStatus);
    }

    setFilteredData(result);
    setHasSearched(true);
    setCurrentPage(1);
  };

  const applyQuickReport = (type: string) => {
    let newFilters = { ...defaultFilters };
    if (type === 'noProjects') {
      newFilters.projectsCountMax = '0';
      newFilters.projectsCountMin = '0';
    } else if (type === 'hasProjects') {
      newFilters.projectsCountMin = '1';
    } else if (type === 'largeFamilies') {
      newFilters.memberCountMin = '6';
    }
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    setHasSearched(false);
    setFilteredData([]);
    setShowFilters(true);
  };

  // Generate Chips for Active Filters
  const getActiveFilterChips = () => {
    const chips: {id: string, label: string, value: string, clearKey: keyof AdvancedFilters | 'members'|'projects'|'date'}[] = [];
    
    if (filters.assigneeId !== 'all') {
       const val = filters.assigneeId === 'none' ? 'بدون مكلف' : assignees.find(a=>a.id===Number(filters.assigneeId))?.name || 'غير محدد';
       chips.push({id: 'assigneeId', label: 'المكلف', value: val, clearKey: 'assigneeId'});
    }
    if (filters.region !== 'all') chips.push({id: 'region', label: 'المكان الحالي', value: filters.region, clearKey: 'region'});
    if (filters.maritalStatus !== 'all') chips.push({id: 'maritalStatus', label: 'الحالة', value: filters.maritalStatus, clearKey: 'maritalStatus'});
    
    if (filters.memberCountMin || filters.memberCountMax) {
      chips.push({id: 'members', label: 'عدد الأفراد', value: `من ${filters.memberCountMin || '1'} إلى ${filters.memberCountMax || '∞'}`, clearKey: 'members'});
    }
    if (filters.projectsCountMin || filters.projectsCountMax) {
      chips.push({id: 'projects', label: 'مرات الاستفادة', value: `من ${filters.projectsCountMin || '0'} إلى ${filters.projectsCountMax || '∞'}`, clearKey: 'projects'});
    }
    if (filters.lastDisbursementFrom || filters.lastDisbursementTo) {
      chips.push({id: 'date', label: 'تاريخ الصرف', value: `من ${filters.lastDisbursementFrom || '-'} إلى ${filters.lastDisbursementTo || '-'}`, clearKey: 'date'});
    }
    if (filters.projectId !== 'all') {
       const proj = projects.find(p=>p.id===Number(filters.projectId));
       if(proj) chips.push({id: 'projectId', label: 'مشروع', value: proj.name, clearKey: 'projectId'});
    }
    if (filters.assistanceTypeId !== 'all') {
       const typ = assistanceTypes.find(p=>p.id===Number(filters.assistanceTypeId));
       if(typ) chips.push({id: 'assistanceTypeId', label: 'نوع المساعدة', value: typ.name, clearKey: 'assistanceTypeId'});
    }
     if (filters.sourceId !== 'all') {
       const src = sources.find(p=>p.id===Number(filters.sourceId));
       if(src) chips.push({id: 'sourceId', label: 'الجهة المانحة', value: src.name, clearKey: 'sourceId'});
    }
    return chips;
  }

  const removeFilter = (clearKey: string) => {
    const next = {...filters};
    if(clearKey === 'members') { next.memberCountMin = ''; next.memberCountMax = ''; }
    else if(clearKey === 'projects') { next.projectsCountMin = ''; next.projectsCountMax = ''; }
    else if(clearKey === 'date') { next.lastDisbursementFrom = ''; next.lastDisbursementTo = ''; }
    else { (next as any)[clearKey] = (defaultFilters as any)[clearKey]; }
    setFilters(next);
  }

  const activeChips = getActiveFilterChips();

  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Export Logic
  const openExportModal = () => {
    const today = new Date().toISOString().split('T')[0].split('-').reverse().join('_');
    let baseName = 'التقرير_المخصص';
    if (activeChips.length > 0) {
      baseName = `تقرير_${activeChips[0].value.replace(/\s+/g, '_')}`; // Use first active filter for smart naming
    }
    setExportFileName(`${baseName}_${today}`);
    setIsExportModalOpen(true);
  };

  const performExport = () => {
    const fileName = exportFileName.trim() ? exportFileName.trim() : 'تقرير_مخصص';
    const dataToExport = filteredData.map((f, i) => {
      const row: any = { '#': i + 1 };
      if (selectedColumns.includes('headFullName')) row['اسم رب الأسرة'] = f.headFullName;
      if (selectedColumns.includes('headIdentityNumber')) row['رقم الهوية'] = f.headIdentityNumber;
      if (selectedColumns.includes('mobileNumber')) row['الجوال'] = f.mobileNumber || 'غير متوفر';
      if (selectedColumns.includes('memberCount')) row['عدد الأفراد'] = f.memberCount + 1;
      if (selectedColumns.includes('region')) row['السكن الحالي'] = f.region || 'غير محدد';
      if (selectedColumns.includes('assignee')) row['المكلف'] = getAssigneeName(f.assigneeId);
      if (selectedColumns.includes('projectsCount')) row['مرات الاستفادة'] = getFamilyProjectCount(f.id);
      if (selectedColumns.includes('lastDisbursement')) row['تاريخ آخر صرف'] = getFamilyLastDisbursement(f.id) || 'لا يوجد';
      return row;
    });
    exportToExcel(dataToExport, fileName);
    setIsExportModalOpen(false);
  };

  const toggleColumn = (colId: string) => {
    setSelectedColumns(prev => 
      prev.includes(colId) ? prev.filter(c => c !== colId) : [...prev, colId]
    );
  };

  // UI Helpers
  const FilterLabel = ({ label, fKey, fKey2 }: {label: string, fKey: keyof AdvancedFilters, fKey2?: keyof AdvancedFilters}) => {
    const isActive = filters[fKey] !== defaultFilters[fKey] || (fKey2 && filters[fKey2] !== defaultFilters[fKey2]);
    return (
       <label className="text-sm font-semibold flex items-center justify-between mb-1.5 text-slate-700">
          {label}
          {isActive && <span className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold"><Check className="w-3 h-3" /> تم التحديد</span>}
       </label>
    )
  }

  const inputClass = (fKey: keyof AdvancedFilters, fKey2?: keyof AdvancedFilters) => {
    const isActive = filters[fKey] !== defaultFilters[fKey] || (fKey2 && filters[fKey2] !== defaultFilters[fKey2]);
    return `w-full px-4 py-2.5 rounded-xl outline-none transition-all text-sm font-medium border ${
      isActive 
      ? 'bg-emerald-50/50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-500/10' 
      : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500/20'
    }`;
  };

  if (loading) return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">التقارير المتقدمة</h2>
          <p className="text-slate-500 text-sm mt-1">تخصيص التقارير الإغاثية باستخدام فلاتر متعددة للوصول الدقيق للبيانات.</p>
        </div>
      </div>

      {/* Quick Access Reports */}
      <div className="bg-gradient-to-l from-indigo-50 to-blue-50/50 rounded-2xl p-4 border border-indigo-100/50 hidden md:block">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-slate-800 text-sm">تقارير سريعة بنقرة واحدة</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
           <button onClick={() => applyQuickReport('noProjects')} className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all shadow-sm group">
              <FolderX className="w-4 h-4 text-red-500" />
              <span className="text-xs font-bold text-slate-700">بلا مشاريع</span>
           </button>
           <button onClick={() => applyQuickReport('hasProjects')} className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all shadow-sm group">
              <FolderHeart className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-slate-700">مستفيدة</span>
           </button>
           <button onClick={() => { setShowFilters(true); document.getElementById('assigneeFilter')?.focus(); }} className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all shadow-sm group">
              <User className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-slate-700">حسب المكلف</span>
           </button>
           <button onClick={() => { setShowFilters(true); document.getElementById('projectFilter')?.focus(); }} className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all shadow-sm group">
              <Folder className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-700">مشروع معين</span>
           </button>
           <button onClick={() => applyQuickReport('largeFamilies')} className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all shadow-sm group">
              <Users className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-bold text-slate-700">الأسر (6+)</span>
           </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
             <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-500" /> خيارات التصفية</h3>
             {activeChips.length > 0 && (
               <button onClick={handleClearFilters} className="text-xs font-bold text-slate-500 hover:text-red-500 flex items-center gap-1.5 transition-colors">
                 <FilterX className="w-4 h-4"/> مسح الكل
               </button>
             )}
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {/* Section 1 */}
             <div className="space-y-5">
                <div>
                  <FilterLabel label="المكلف (Assignee)" fKey="assigneeId" />
                  <select id="assigneeFilter" value={filters.assigneeId} onChange={e => setFilters({...filters, assigneeId: e.target.value})} className={`${inputClass('assigneeId')} appearance-none`}>
                    <option value="all">الكل</option>
                    <option value="none">بدون مكلف</option>
                    {assignees.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>

                <div>
                  <FilterLabel label="المكان الحالي (التواجد)" fKey="region" />
                  <select value={filters.region} onChange={e => setFilters({...filters, region: e.target.value})} className={`${inputClass('region')} appearance-none`}>
                    <option value="all">الكل</option>
                    <option value="شمال وادي غزة">شمال وادي غزة</option>
                    <option value="جنوب وادي غزة">جنوب وادي غزة</option>
                    <option value="غير محدد">غير محدد</option>
                  </select>
                </div>

                <div>
                  <FilterLabel label="الحالة الاجتماعية" fKey="maritalStatus" />
                  <select value={filters.maritalStatus} onChange={e => setFilters({...filters, maritalStatus: e.target.value})} className={`${inputClass('maritalStatus')} appearance-none`}>
                    <option value="all">الكل</option>
                    <option value="أعزب">أعزب</option>
                    <option value="متزوج">متزوج</option>
                    <option value="أرمل">أرمل</option>
                    <option value="مطلق">مطلق</option>
                  </select>
                </div>
             </div>

             {/* Section 2 */}
             <div className="space-y-5">
                <div>
                  <FilterLabel label="عدد الأفراد (من - إلى)" fKey="memberCountMin" fKey2="memberCountMax" />
                  <div className="flex gap-2">
                    <input type="number" placeholder="من" min="1" value={filters.memberCountMin} onChange={e => setFilters({...filters, memberCountMin: e.target.value})} className={`${inputClass('memberCountMin', 'memberCountMax')} text-center w-1/2`} />
                    <input type="number" placeholder="إلى" min="1" value={filters.memberCountMax} onChange={e => setFilters({...filters, memberCountMax: e.target.value})} className={`${inputClass('memberCountMax', 'memberCountMin')} text-center w-1/2`} />
                  </div>
                </div>

                <div>
                  <FilterLabel label="مرات الاستفادة / المشاريع (من - إلى)" fKey="projectsCountMin" fKey2="projectsCountMax" />
                  <div className="flex gap-2">
                    <input type="number" placeholder="من" min="0" value={filters.projectsCountMin} onChange={e => setFilters({...filters, projectsCountMin: e.target.value})} className={`${inputClass('projectsCountMin', 'projectsCountMax')} text-center w-1/2`} />
                    <input type="number" placeholder="إلى" min="0" value={filters.projectsCountMax} onChange={e => setFilters({...filters, projectsCountMax: e.target.value})} className={`${inputClass('projectsCountMin', 'projectsCountMax')} text-center w-1/2`} />
                  </div>
                </div>

                <div>
                  <FilterLabel label="تاريخ آخر صرف (من - إلى)" fKey="lastDisbursementFrom" fKey2="lastDisbursementTo" />
                  <div className="flex gap-2">
                    <input type="date" value={filters.lastDisbursementFrom} onChange={e => setFilters({...filters, lastDisbursementFrom: e.target.value})} className={`${inputClass('lastDisbursementFrom', 'lastDisbursementTo')} font-mono text-xs w-1/2`} />
                    <input type="date" value={filters.lastDisbursementTo} onChange={e => setFilters({...filters, lastDisbursementTo: e.target.value})} className={`${inputClass('lastDisbursementTo', 'lastDisbursementFrom')} font-mono text-xs w-1/2`} />
                  </div>
                </div>
             </div>

             {/* Section 3 */}
             <div className="space-y-5">
                <div>
                  <FilterLabel label="مشروع معين" fKey="projectId" />
                  <select id="projectFilter" value={filters.projectId} onChange={e => setFilters({...filters, projectId: e.target.value})} className={`${inputClass('projectId')} appearance-none`}>
                    <option value="all">كافة المشاريع</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div>
                  <FilterLabel label="نوع المساعدة" fKey="assistanceTypeId" />
                  <select value={filters.assistanceTypeId} onChange={e => setFilters({...filters, assistanceTypeId: e.target.value})} className={`${inputClass('assistanceTypeId')} appearance-none`}>
                    <option value="all">كافة الأنواع</option>
                    {assistanceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div>
                  <FilterLabel label="الجهة المانحة / المصدر" fKey="sourceId" />
                  <select value={filters.sourceId} onChange={e => setFilters({...filters, sourceId: e.target.value})} className={`${inputClass('sourceId')} appearance-none`}>
                    <option value="all">كافة المصادر</option>
                    {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
             </div>
          </div>
          
          {/* Custom Columns Selection UI */}
          <div className="border-t border-slate-100 p-5 bg-slate-50/50 relative">
             <div className="flex items-center gap-2 mb-3">
               <Settings2 className="w-4 h-4 text-slate-500" />
               <h4 className="text-sm font-bold text-slate-700">تخصيص أعمدة العرض والتصدير:</h4>
             </div>
             <div className="flex flex-wrap gap-2">
               {AVAILABLE_COLUMNS.map(col => {
                  const isActive = selectedColumns.includes(col.id);
                  return (
                    <button
                       key={col.id}
                       onClick={() => toggleColumn(col.id)}
                       className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm ${
                          isActive 
                          ? 'bg-white border-indigo-200 text-indigo-700' 
                          : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 hover:opacity-100 hover:bg-white'
                       }`}
                    >
                       {isActive ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                       {col.label}
                    </button>
                  )
               })}
             </div>
          </div>

        </div>
      )}

      {/* Results Section */}
      {hasSearched && (
        <div className="bg-white rounded-3xl shadow-[0_2px_20px_-3px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden animate-in fade-in duration-500 relative flex flex-col">
          
          {/* Active Filters Summary (Chip bar) */}
          {activeChips.length > 0 && (
             <div className="px-5 py-4 bg-indigo-50/40 border-b border-indigo-100">
                <div className="flex flex-wrap items-center gap-2">
                   <span className="text-xs font-bold text-indigo-800 flex items-center gap-1.5 ml-2">
                      <FilterX className="w-4 h-4" /> الفلاتر المطبقة:
                   </span>
                   {activeChips.map(chip => (
                      <span key={chip.id} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-900 text-xs font-bold shadow-sm">
                         <span className="text-emerald-600/70">{chip.label}:</span> {chip.value}
                         <button onClick={() => removeFilter(chip.clearKey)} className="hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 ml-1 transition-colors">
                            <X className="w-3 h-3" />
                         </button>
                      </span>
                   ))}
                   
                   <button onClick={handleClearFilters} className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors mr-auto flex items-center gap-1">
                      مسح الكل
                   </button>
                </div>
             </div>
          )}

          <div className="p-4 sm:p-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20">
              <div className="flex items-center gap-3">
                 <h3 className="font-extrabold text-xl text-slate-800">النتائج</h3>
                 <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-bold leading-none shadow-sm">{filteredData.length} سجل مطبق</span>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowFilters(!showFilters)} 
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-600 rounded-xl border border-slate-200 text-sm font-bold hover:bg-slate-100 transition-colors shadow-sm"
                >
                  {showFilters ? <><ChevronUp className="w-4 h-4"/> طي الفلاتر</> : <><ChevronDown className="w-4 h-4"/> إظهار الفلاتر</>}
                </button>
                
                {filteredData.length > 0 && (
                  <button onClick={openExportModal} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-500/20">
                     <Download className="w-4 h-4" /> تصدير Excel
                  </button>
                )}
              </div>
          </div>

          <div className="overflow-hidden flex flex-col border-t border-slate-100">
             {filteredData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-slate-50/50 min-h-[350px]">
                  <FilterX className="w-12 h-12 mb-3 text-slate-300" />
                  <p className="font-bold text-lg text-slate-600">لا يوجد بيانات مطابقة للفلاتر المحددة</p>
                  <p className="text-sm mt-1 text-slate-500 max-w-sm text-center">قم بإلغاء بعض الفلاتر العلوية أو تغيير نطاقات البحث للحصول على نتائج</p>
                  <button onClick={handleClearFilters} className="mt-4 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 shadow-sm text-sm">تصفير الفلاتر</button>
                </div>
              ) : (
              <>
              <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
              <table className="w-full text-right text-sm whitespace-nowrap relative min-w-[1000px]">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold sticky top-0 z-20 shadow-sm">
                  <tr>
                    {selectedColumns.includes('headFullName') && <th className="px-5 py-4">اسم رب الأسرة</th>}
                    {selectedColumns.includes('headIdentityNumber') && <th className="px-5 py-4 text-center">رقم الهوية</th>}
                    {selectedColumns.includes('mobileNumber') && <th className="px-5 py-4 text-center">رقم الجوال</th>}
                    {selectedColumns.includes('memberCount') && <th className="px-5 py-4 text-center">عدد الأفراد</th>}
                    {selectedColumns.includes('region') && <th className="px-5 py-4 text-center">السكن الحالي</th>}
                    {selectedColumns.includes('assignee') && <th className="px-5 py-4 text-center">المكلف</th>}
                    {selectedColumns.includes('projectsCount') && <th className="px-5 py-4 text-center">مرات الاستفادة</th>}
                    {selectedColumns.includes('lastDisbursement') && <th className="px-5 py-4 text-center">تاريخ آخر صرف</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white relative z-0">
                    {paginatedData.map(f => {
                      const lastDisb = getFamilyLastDisbursement(f.id);
                      return (
                        <tr key={f.id} className="hover:bg-indigo-50/30 transition-colors group">
                          {selectedColumns.includes('headFullName') && <td className="px-5 py-3 font-bold text-slate-800">{f.headFullName}</td>}
                          {selectedColumns.includes('headIdentityNumber') && <td className="px-5 py-3 font-mono text-slate-500 text-xs tracking-wider text-center">{f.headIdentityNumber}</td>}
                          {selectedColumns.includes('mobileNumber') && <td className="px-5 py-3 font-mono text-slate-500 text-xs tracking-wide text-center">{f.mobileNumber || '-'}</td>}
                          {selectedColumns.includes('memberCount') && <td className="px-5 py-3 text-center font-bold text-slate-700">{f.memberCount + 1}</td>}
                          {selectedColumns.includes('region') && <td className="px-5 py-3 text-center">
                             <span className={`inline-flex px-2 py-1.5 rounded-md text-[10px] font-bold ${f.region === 'شمال وادي غزة' ? 'bg-orange-100 text-orange-700' : f.region === 'جنوب وادي غزة' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                                {f.region || 'غير محدد'}
                             </span>
                          </td>}
                          {selectedColumns.includes('assignee') && <td className="px-5 py-3 text-center text-slate-600 font-medium">{getAssigneeName(f.assigneeId)}</td>}
                          {selectedColumns.includes('projectsCount') && <td className="px-5 py-3 text-center">
                             <span className={`inline-flex items-center justify-center min-w-[2rem] px-1.5 py-1 rounded-md text-xs font-bold ${getFamilyProjectCount(f.id) > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                               {getFamilyProjectCount(f.id)}
                             </span>
                          </td>}
                          {selectedColumns.includes('lastDisbursement') && <td className="px-5 py-3 text-center text-slate-500 font-mono text-xs">
                            {lastDisb ? (
                               <span className="bg-slate-50 px-2.5 py-1 rounded border border-slate-200 font-medium">{lastDisb}</span>
                            ) : (
                               <span className="text-slate-300">-</span>
                            )}
                          </td>}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              </div>
              
              <div className="flex flex-wrap items-center justify-between p-4 border-t border-slate-100 bg-slate-50/80 gap-4">
                  <span className="text-xs text-slate-500 font-medium font-mono bg-white px-3 py-1.5 rounded border border-slate-200 shadow-sm">
                     عرض {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} من أصل {filteredData.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                     <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-600 transition-colors shadow-sm">السابق</button>
                     <span className="text-xs font-extrabold text-slate-700 px-3 bg-white py-2 rounded-lg border border-slate-200 shadow-sm">صفحة {currentPage} / {totalPages}</span>
                     <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-600 transition-colors shadow-sm">التالي</button>
                  </div>
              </div>
              </>
              )}
          </div>
        </div>
      )}

      {/* Enhanced Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsExportModalOpen(false)} className="absolute top-6 left-6 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            
            <div className="mb-6">
               <h3 className="text-xl font-extrabold text-slate-800 mb-1 flex items-center gap-2">
                 <Download className="w-5 h-5 text-emerald-600" /> تصدير التقرير
               </h3>
               <p className="text-sm text-slate-500">سيتم استخراج البيانات بناءً على الفلاتر والأعمدة التي حددتها.</p>
            </div>
            
            <div className="space-y-5 mb-8">
              {/* Display Active Filters summary inside modal */}
              {activeChips.length > 0 ? (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                   <p className="text-xs font-bold text-indigo-800 mb-2">الفلاتر المضمنة في الاستخراج:</p>
                   <div className="flex flex-wrap gap-1.5">
                     {activeChips.map(chip => (
                        <span key={chip.id} className="px-2 py-1 bg-white border border-indigo-100 text-indigo-700 text-[10px] font-bold rounded">
                          {chip.label}: {chip.value}
                        </span>
                     ))}
                   </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                   <p className="text-xs font-bold text-slate-500">سيتم استخراج كافة البيانات (لا يوجد فلاتر مطبقة)</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">تسمية الملف (اقتراح ذكي)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={exportFileName} 
                    onChange={e => setExportFileName(e.target.value)} 
                    placeholder="كشف مخصص" 
                    autoFocus
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-slate-800 text-left" dir="ltr"
                  />
                  <span className="absolute left-4 top-3.5 text-xs font-bold text-slate-400 pointer-events-none">.xlsx</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={performExport} className="flex-1 py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2">
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
