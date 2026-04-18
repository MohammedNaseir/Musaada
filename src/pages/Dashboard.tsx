import { useEffect, useState } from 'react';
import { familiesService, projectsService, familyProjectService } from '../services';
import { Users, LayoutList, HandHeart, AlertCircle, TrendingUp, Activity } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalFamilies: 0,
    activeProjects: 0,
    totalDisbursements: 0,
    unassistedFamilies: 0
  });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      const allFamilies = await familiesService.getAll();
      const allProjects = await projectsService.getAll();
      const allDisbursements = await familyProjectService.getAll();
      
      const activeProjects = allProjects.filter(p => p.status === 'نشط').length;
      
      // Families with no assistance
      const assistedFamilyIds = new Set(allDisbursements.map(d => d.familyId));
      const unassistedFamilies = allFamilies.filter(f => !assistedFamilyIds.has(f.id)).length;

      setStats({
        totalFamilies: allFamilies.length,
        activeProjects,
        totalDisbursements: allDisbursements.length,
        unassistedFamilies
      });

      // Recent disbursements
      const recentRaw = [...allDisbursements].sort((a, b) => new Date(b.disbursementDate).getTime() - new Date(a.disbursementDate).getTime()).slice(0, 5);
      const recentFull = recentRaw.map(r => ({
        ...r,
        family: allFamilies.find(f => f.id === r.familyId)?.headFullName || 'غير محدد',
        project: allProjects.find(p => p.id === r.projectId)?.name || 'غير محدد'
      }));
      setRecent(recentFull);
    };

    loadStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">لوحة المعلومات</h2>
          <p className="text-slate-500 mt-1">نظرة عامة على إحصائيات النظام ومؤشرات الأداء.</p>
        </div>
        <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center gap-2 text-sm font-semibold text-slate-600">
           <Activity className="w-4 h-4 text-emerald-500" /> النظام يعمل بكفاءة
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 p-6 flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out opacity-50 z-0"></div>
          <div className="flex justify-between items-start z-10">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shadow-sm"><Users className="w-6 h-6" /></div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
               <TrendingUp className="w-3 h-3"/> مستمر
            </span>
          </div>
          <div className="z-10">
            <p className="text-3xl font-extrabold text-slate-800 mt-2">{stats.totalFamilies}</p>
            <p className="text-sm font-semibold text-slate-500 mt-1">إجمالي العائلات المسجلة</p>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 p-6 flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out opacity-50 z-0"></div>
          <div className="flex justify-between items-start z-10">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl shadow-sm"><LayoutList className="w-6 h-6" /></div>
          </div>
          <div className="z-10">
            <p className="text-3xl font-extrabold text-slate-800 mt-2">{stats.activeProjects}</p>
            <p className="text-sm font-semibold text-slate-500 mt-1">المشاريع الإغاثية النشطة</p>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 p-6 flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out opacity-50 z-0"></div>
          <div className="flex justify-between items-start z-10">
             <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm"><HandHeart className="w-6 h-6" /></div>
          </div>
          <div className="z-10">
            <p className="text-3xl font-extrabold text-slate-800 mt-2">{stats.totalDisbursements}</p>
            <p className="text-sm font-semibold text-slate-500 mt-1">إجمالي مساعدات تم تخصيصها</p>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 p-6 flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out opacity-50 z-0"></div>
          <div className="flex justify-between items-start z-10">
             <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shadow-sm"><AlertCircle className="w-6 h-6" /></div>
          </div>
          <div className="z-10">
            <p className="text-3xl font-extrabold text-slate-800 mt-2">{stats.unassistedFamilies}</p>
            <p className="text-sm font-semibold text-slate-500 mt-1">عائلات قيد انتظار الدعم</p>
          </div>
        </div>
      </div>

      {/* Recent Disbursements Table */}
      <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-lg text-slate-800">آخر عمليات تخصيص مساعدات (الحديثة)</h3>
          <p className="text-xs text-slate-500 mt-1">سجل التخصيصات المضافة مؤخراً للنظام</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-white border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4">اسم العائلة المستفيدة</th>
                <th className="px-6 py-4">المشروع الإغاثي</th>
                <th className="px-6 py-4">تاريخ التخصيص</th>
                <th className="px-6 py-4 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recent.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{r.family}</td>
                  <td className="px-6 py-4 font-semibold text-indigo-700">{r.project}</td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{r.disbursementDate}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-md text-xs font-semibold shadow-sm
                      ${r.status === 'مكتمل' ? 'bg-emerald-100 text-emerald-700' : 
                        r.status === 'مؤجل' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recent.length === 0 && <div className="p-10 text-center text-slate-500 font-medium">لا يوجد بيانات لصرفيات جديدة.</div>}
        </div>
      </div>
    </div>
  );
}
