import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { familiesService, familyMembersService, familyProjectService, projectsService, assigneesService } from '../../services';
import { Family, FamilyMember, FamilyProject, Project, Assignee } from '../../models/types';
import { ArrowLeft, User, Phone, MapPin, Users, Edit } from 'lucide-react';

export default function FamilyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [disbursements, setDisbursements] = useState<(FamilyProject & { projectName: string })[]>([]);
  const [assignee, setAssignee] = useState<Assignee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    const fid = Number(id);
    
    try {
      const fData = await familiesService.getById(fid);
      if (!fData) {
        navigate('/families');
        return;
      }
      setFamily(fData);

      if (fData.assigneeId) {
        const assignees = await assigneesService.getAll();
        setAssignee(assignees.find(a => a.id === fData.assigneeId) || null);
      }

      const mData = await familyMembersService.getByFamilyId(fid);
      setMembers(mData as FamilyMember[]);

      const dData = await familyProjectService.getByFamilyId(fid);
      const allProjects = await projectsService.getAll();
      
      const fullDisb = dData.map(d => ({
        ...d,
        projectName: allProjects.find(p => p.id === d.projectId)?.name || 'غير معروف'
      }));
      setDisbursements(fullDisb);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex h-[50vh] items-center justify-center text-[#A5A3AE]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7367F0]"></div>
    </div>
  );
  if (!family) return <div className="text-center p-12 text-[#A5A3AE] font-semibold text-lg">لم يتم العثور على العائلة.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/families" className="p-2 border border-[#DBDADE] bg-white rounded-md text-[#5D596C] hover:bg-[#F4F5FA] hover:text-[#3D3B4A] transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h2 className="text-xl font-bold text-[#3D3B4A]">ملف العائلة: {family.headFullName}</h2>
            <p className="text-[#A5A3AE] text-sm mt-1 font-mono">{family.headIdentityNumber}</p>
          </div>
        </div>
        <Link to={`/families/${id}/edit`} className="flex items-center gap-2 px-4 py-2 bg-[#7367F0] text-white font-medium rounded-md hover:bg-[#5E50EE] transition-colors shadow-sm cursor-pointer h-[38px] text-sm whitespace-nowrap">
          <Edit className="w-4 h-4" /> تعديل البيانات
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-[0_4px_24px_rgba(34,41,47,0.08)] p-5 flex flex-col gap-5">
            <h3 className="font-bold text-lg text-[#3D3B4A]">بيانات الاتصال</h3>
            
            <div className="flex items-center gap-4">
              <div className="p-2 bg-[#F0EEFF] text-[#7367F0] rounded-md"><User className="w-5 h-5"/></div>
              <div>
                <p className="text-xs font-semibold text-[#A5A3AE]">رب الأسرة</p>
                <p className="font-medium text-[#5D596C] mt-0.5 w-[140px] truncate" title={family.headFullName}>{family.headFullName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-2 bg-[#E0F9FC] text-[#00CFE8] rounded-md"><Phone className="w-5 h-5"/></div>
              <div>
                <p className="text-xs font-semibold text-[#A5A3AE]">رقم الجوال</p>
                <p className="font-mono text-[#5D596C] font-medium mt-0.5" dir="ltr">{family.mobileNumber || 'لا يوجد'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-2 bg-[#FCEAEA] text-[#EA5455] rounded-md"><MapPin className="w-5 h-5"/></div>
              <div>
                <p className="text-xs font-semibold text-[#A5A3AE]">السكن الأصلي</p>
                <p className="font-medium text-[#5D596C] mt-0.5">{family.residenceBeforeWar || 'غير متوفر'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-2 bg-[#FFF0E1] text-[#FF9F43] rounded-md"><MapPin className="w-5 h-5"/></div>
              <div>
                <p className="text-xs font-semibold text-[#A5A3AE]">منطقة النزوح (حاليا)</p>
                <div className="mt-1 flex flex-col gap-1.5">
                   <p className="font-medium text-[#5D596C]">{family.currentResidence}</p>
                   {family.isDisplaced ? (
                     <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FFF0E1] text-[#FF9F43] w-fit">عائلة نازحة - {family.region || 'غير محدد'}</span>
                   ) : (
                     <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#E8F9F0] text-[#28C76F] w-fit">مقيم (غير نازح) - {family.region || 'غير محدد'}</span>
                   )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-2 bg-[#E8F9F0] text-[#28C76F] rounded-md"><Users className="w-5 h-5"/></div>
              <div>
                <p className="text-xs font-semibold text-[#A5A3AE]">الجهة المكلفة</p>
                <p className="font-medium text-[#5D596C] mt-0.5">{assignee ? assignee.name : 'غير محدد'}</p>
              </div>
            </div>
          </div>
          
          {family.notes && (
             <div className="bg-[#FFF0E1]/50 rounded-xl border border-[#FF9F43]/20 p-5">
               <h3 className="font-bold text-[#FF9F43] mb-2 text-sm">ملاحظات</h3>
               <p className="text-sm text-[#FF9F43]/90 leading-relaxed">{family.notes}</p>
             </div>
          )}
        </div>

        <div className="md:col-span-3 space-y-6">
          <div className="bg-white rounded-xl shadow-[0_4px_24px_rgba(34,41,47,0.08)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E6E6E8]">
              <h3 className="font-bold text-lg text-[#3D3B4A]">أفراد العائلة المرفقين</h3>
              <p className="text-sm text-[#A5A3AE] mt-1">إجمالي الأفراد (بدون رب الأسرة): {members.length}</p>
            </div>
            <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
              <table className="w-full text-right whitespace-nowrap min-w-[500px]">
                <thead className="bg-[#F8F7FA] border-b border-[#E6E6E8] text-[#5D596C] sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 font-semibold uppercase tracking-wider text-xs">الاسم</th>
                    <th className="px-6 py-3 font-semibold uppercase tracking-wider text-xs">الهوية</th>
                    <th className="px-6 py-3 font-semibold uppercase tracking-wider text-xs">الصلة</th>
                    <th className="px-6 py-3 font-semibold uppercase tracking-wider text-xs">الجنس</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E6E8]">
                  {members.length === 0 ? <tr><td colSpan={4} className="text-center py-8 text-[#A5A3AE]">لا يوجد أفراد مسجلين.</td></tr> :
                    members.map(m => (
                    <tr key={m.id} className="hover:bg-[#7367F0]/[0.05] transition-colors h-[52px]">
                      <td className="px-6 py-2 font-medium text-[#7367F0]">{m.fullName}</td>
                      <td className="px-6 py-2 font-mono text-[#5D596C] text-sm">{m.identityNumber || '-'}</td>
                      <td className="px-6 py-2 text-[#5D596C] text-sm">{m.relation}</td>
                      <td className="px-6 py-2 text-[#5D596C] text-sm">{m.gender}</td>
                    </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-[0_4px_24px_rgba(34,41,47,0.08)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E6E6E8]">
              <h3 className="font-bold text-lg text-[#3D3B4A]">المساعدات المخصصة للعائلة</h3>
              <p className="text-sm text-[#A5A3AE] mt-1">سجل المشاريع التي استفادت منها هذه العائلة</p>
            </div>
            <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
              <table className="w-full text-right whitespace-nowrap min-w-[600px]">
                <thead className="bg-[#F8F7FA] border-b border-[#E6E6E8] text-[#5D596C] sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 font-semibold uppercase tracking-wider text-xs">تاريخ التخصيص</th>
                    <th className="px-6 py-3 font-semibold uppercase tracking-wider text-xs">المشروع</th>
                    <th className="px-6 py-3 font-semibold uppercase tracking-wider text-xs">الكمية</th>
                    <th className="px-6 py-3 font-semibold uppercase tracking-wider text-xs text-center">الحالة</th>
                    <th className="px-6 py-3 font-semibold uppercase tracking-wider text-xs">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E6E8]">
                  {disbursements.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-[#A5A3AE]">لم يتم تخصيص أي مساعدات لهذه العائلة القائمة.</td></tr> :
                    disbursements.map(a => (
                    <tr key={a.id} className="hover:bg-[#7367F0]/[0.05] transition-colors h-[52px]">
                      <td className="px-6 py-2 text-[#5D596C] text-sm">{a.disbursementDate}</td>
                      <td className="px-6 py-2 font-medium text-[#7367F0]">{a.projectName}</td>
                      <td className="px-6 py-2 font-mono text-[#5D596C] text-sm">{a.quantity}</td>
                      <td className="px-6 py-2 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[13px] font-medium
                          ${a.status === 'مكتمل' ? 'bg-[#E8F9F0] text-[#28C76F]' : 
                            a.status === 'مؤجل' ? 'bg-[#FFF0E1] text-[#FF9F43]' : 'bg-[#FCEAEA] text-[#EA5455]'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-6 py-2 text-[#A5A3AE] text-sm">{a.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
