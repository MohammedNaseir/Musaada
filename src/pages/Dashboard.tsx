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
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h2 className="h3 text-[var(--secondary-500)] tracking-tight">لوحة المعلومات</h2>
        <p className="body-3 text-[var(--grey-600)] mt-1 mb-2">إحصائيات النظام العامة والتحديثات الأخيرة.</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card flex flex-col gap-3 relative transition-transform hover:-translate-y-1 duration-200">
          <div className="flex justify-between items-start">
             <div className="flex flex-col">
               <span className="h3">{stats.totalFamilies}</span>
               <span className="body-3 mt-1">إجمالي العائلات</span>
             </div>
             <div className="w-[42px] h-[42px] rounded-lg bg-[var(--primary-100)] text-[var(--primary-500)] flex items-center justify-center">
               <Users className="w-5 h-5" />
             </div>
          </div>
        </div>
        
        <div className="card flex flex-col gap-3 relative transition-transform hover:-translate-y-1 duration-200">
          <div className="flex justify-between items-start">
             <div className="flex flex-col">
               <span className="h3">{stats.activeProjects}</span>
               <span className="body-3 mt-1">المشاريع النشطة</span>
             </div>
             <div className="w-[42px] h-[42px] rounded-lg bg-[var(--tertiary-100)] text-[var(--tertiary-500)] flex items-center justify-center">
               <LayoutList className="w-5 h-5" />
             </div>
          </div>
        </div>
        
        <div className="card flex flex-col gap-3 relative transition-transform hover:-translate-y-1 duration-200">
          <div className="flex justify-between items-start">
             <div className="flex flex-col">
               <span className="h3">{stats.totalDisbursements}</span>
               <span className="body-3 mt-1">إجمالي المساعدات المخصصة</span>
             </div>
             <div className="w-[42px] h-[42px] rounded-lg bg-[var(--alert-success-100)] text-[var(--alert-success-500)] flex items-center justify-center">
               <HandHeart className="w-5 h-5" />
             </div>
          </div>
        </div>
        
        <div className="card flex flex-col gap-3 relative transition-transform hover:-translate-y-1 duration-200">
          <div className="flex justify-between items-start">
             <div className="flex flex-col">
               <span className="h3">{stats.unassistedFamilies}</span>
               <span className="body-3 mt-1">عائلات قيد الانتظار</span>
             </div>
             <div className="w-[42px] h-[42px] rounded-lg bg-[var(--alert-danger-100)] text-[var(--alert-danger-500)] flex items-center justify-center">
               <AlertCircle className="w-5 h-5" />
             </div>
          </div>
        </div>
      </div>

      {/* Recent Allocations Table */}
      <div className="card p-0 overflow-hidden">
        <div className="card-header pb-0 border-b-0 px-6 pt-6 flex justify-between items-center">
          <h3 className="card-title">أحدث التخصيصات (آخر 5 إجراءات)</h3>
        </div>
        <div className="overflow-x-auto overflow-y-auto mt-4">
          <table className="table min-w-[600px] rounded-none shadow-none">
            <thead>
              <tr>
                <th>العائلة</th>
                <th>المشروع</th>
                <th>التاريخ</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-[var(--grey-500)] py-8 font-medium">لا توجد بيانات مسجلة مؤخراً</td>
                </tr>
              ) : (
                recent.map((r, i) => (
                   <tr key={i}>
                     <td className="font-bold text-[var(--secondary-500)]">{r.family}</td>
                     <td>{r.project}</td>
                     <td className="font-mono">{r.disbursementDate}</td>
                     <td>
                        <span className={`badge ${
                          r.status === 'مكتمل' ? 'badge-success' : 
                          r.status === 'مؤجل' ? 'badge-warning' : 
                          r.status === 'ملغي' ? 'badge-danger' : 
                          'badge-primary'
                        }`}>
                           {r.status}
                        </span>
                     </td>
                   </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
