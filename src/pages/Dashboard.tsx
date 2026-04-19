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
        <h2 className="text-2xl font-bold text-[#3D3B4A] tracking-tight">لوحة المعلومات</h2>
        <p className="text-[#A5A3AE] text-sm mt-1 mb-2">إحصائيات النظام العامة والتحديثات الأخيرة.</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-[0_4px_24px_rgba(34,41,47,0.08)] p-6 flex flex-col gap-3 relative transition-transform hover:-translate-y-1 duration-200">
          <div className="flex justify-between items-start">
             <div className="flex flex-col">
               <span className="text-[28px] font-bold text-[#3D3B4A]">{stats.totalFamilies}</span>
               <span className="text-sm text-[#5D596C] mt-1">إجمالي العائلات</span>
             </div>
             <div className="w-[42px] h-[42px] rounded-lg bg-[#F0EEFF] text-[#7367F0] flex items-center justify-center">
               <Users className="w-5 h-5" />
             </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-[0_4px_24px_rgba(34,41,47,0.08)] p-6 flex flex-col gap-3 relative transition-transform hover:-translate-y-1 duration-200">
          <div className="flex justify-between items-start">
             <div className="flex flex-col">
               <span className="text-[28px] font-bold text-[#3D3B4A]">{stats.activeProjects}</span>
               <span className="text-sm text-[#5D596C] mt-1">المشاريع النشطة</span>
             </div>
             <div className="w-[42px] h-[42px] rounded-lg bg-[#E8F9F0] text-[#28C76F] flex items-center justify-center">
               <LayoutList className="w-5 h-5" />
             </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-[0_4px_24px_rgba(34,41,47,0.08)] p-6 flex flex-col gap-3 relative transition-transform hover:-translate-y-1 duration-200">
          <div className="flex justify-between items-start">
             <div className="flex flex-col">
               <span className="text-[28px] font-bold text-[#3D3B4A]">{stats.totalDisbursements}</span>
               <span className="text-sm text-[#5D596C] mt-1">إجمالي المساعدات المخصصة</span>
             </div>
             <div className="w-[42px] h-[42px] rounded-lg bg-[#FFF0E1] text-[#FF9F43] flex items-center justify-center">
               <HandHeart className="w-5 h-5" />
             </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-[0_4px_24px_rgba(34,41,47,0.08)] p-6 flex flex-col gap-3 relative transition-transform hover:-translate-y-1 duration-200">
          <div className="flex justify-between items-start">
             <div className="flex flex-col">
               <span className="text-[28px] font-bold text-[#3D3B4A]">{stats.unassistedFamilies}</span>
               <span className="text-sm text-[#5D596C] mt-1">عائلات قيد الانتظار</span>
             </div>
             <div className="w-[42px] h-[42px] rounded-lg bg-[#FCEAEA] text-[#EA5455] flex items-center justify-center">
               <AlertCircle className="w-5 h-5" />
             </div>
          </div>
        </div>
      </div>

      {/* Recent Allocations Table */}
      <div className="bg-white rounded-xl shadow-[0_4px_24px_rgba(34,41,47,0.08)] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#E6E6E8] flex justify-between items-center">
          <h3 className="text-lg font-bold text-[#3D3B4A]">أحدث التخصيصات (آخر 5 إجراءات)</h3>
        </div>
        <div className="overflow-x-auto overflow-y-auto">
          <table className="w-full text-right whitespace-nowrap min-w-[600px]">
            <thead className="bg-[#F8F7FA]">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider">العائلة</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider">المشروع</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider">التاريخ</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#5D596C] uppercase tracking-wider">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E6E8]">
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[#A5A3AE]">لا توجد بيانات مسجلة مؤخراً</td>
                </tr>
              ) : (
                recent.map((r, i) => (
                   <tr key={i} className="hover:bg-[#7367F0]/[0.05] transition-colors even:bg-[#FAFAFA] h-[52px]">
                     <td className="px-6 py-2 text-sm font-bold text-[#3D3B4A]">{r.family}</td>
                     <td className="px-6 py-2 text-sm text-[#5D596C]">{r.project}</td>
                     <td className="px-6 py-2 text-sm font-mono text-[#5D596C]">{r.disbursementDate}</td>
                     <td className="px-6 py-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[13px] font-medium leading-5 ${
                          r.status === 'مكتمل' ? 'bg-[#E8F9F0] text-[#28C76F]' : 
                          r.status === 'مؤجل' ? 'bg-[#FFF0E1] text-[#FF9F43]' : 
                          r.status === 'ملغي' ? 'bg-[#FCEAEA] text-[#EA5455]' : 
                          'bg-[#E0F9FC] text-[#00CFE8]'
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
