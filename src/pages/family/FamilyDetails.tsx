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
    <div className="flex h-[50vh] items-center justify-center text-slate-500">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
  if (!family) return <div className="text-center p-12 text-slate-500 font-semibold text-lg">لم يتم العثور على العائلة.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/families" className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"><ArrowLeft className="w-5 h-5 text-slate-600" /></Link>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">ملف العائلة: {family.headFullName}</h2>
            <p className="text-slate-500 text-sm mt-1 font-mono">{family.headIdentityNumber}</p>
          </div>
        </div>
        <Link to={`/families/${id}/edit`} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-100 transition-colors shadow-sm cursor-pointer">
          <Edit className="w-4 h-4" /> تعديل البيانات
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 p-6 flex flex-col gap-5">
            <h3 className="font-bold text-lg border-b border-slate-100 pb-2 text-slate-800">بيانات الاتصال</h3>
            
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><User className="w-5 h-5"/></div>
              <div>
                <p className="text-xs font-semibold text-slate-500">رب الأسرة</p>
                <p className="font-medium text-slate-800 mt-0.5 w-[140px] truncate" title={family.headFullName}>{family.headFullName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Phone className="w-5 h-5"/></div>
              <div>
                <p className="text-xs font-semibold text-slate-500">رقم الجوال</p>
                <p className="font-mono text-slate-800 font-medium mt-0.5" dir="ltr">{family.mobileNumber || 'لا يوجد'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><MapPin className="w-5 h-5"/></div>
              <div>
                <p className="text-xs font-semibold text-slate-500">السكن الأصلي</p>
                <p className="font-medium text-slate-800 mt-0.5">{family.residenceBeforeWar || 'غير متوفر'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl"><MapPin className="w-5 h-5"/></div>
              <div>
                <p className="text-xs font-semibold text-slate-500">منطقة النزوح (حاليا)</p>
                <p className="font-medium text-slate-800 mt-0.5 flex flex-col gap-1">
                   <span>{family.currentResidence}</span>
                   {family.isDisplaced ? (
                     <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 w-fit">عائلة نازحة المأوى - {family.region || 'غير محدد'}</span>
                   ) : (
                     <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 w-fit">مقيم (غير نازح) - {family.region || 'غير محدد'}</span>
                   )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Users className="w-5 h-5"/></div>
              <div>
                <p className="text-xs font-semibold text-slate-500">الجهة المكلفة</p>
                <p className="font-medium text-slate-800 mt-0.5">{assignee ? assignee.name : 'غير محدد'}</p>
              </div>
            </div>
          </div>
          
          {family.notes && (
             <div className="bg-amber-50 rounded-2xl border border-amber-100/50 p-5">
               <h3 className="font-bold text-amber-900 mb-2">ملاحظات</h3>
               <p className="text-sm text-amber-800/80 leading-relaxed">{family.notes}</p>
             </div>
          )}
        </div>

        <div className="md:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-slate-800">أفراد العائلة المرفقين</h3>
                <p className="text-xs text-slate-500 mt-1">إجمالي الأفراد (بدون رب الأسرة): {members.length}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-white border-b border-slate-100 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-6 py-4">الاسم</th>
                    <th className="px-6 py-4">الهوية</th>
                    <th className="px-6 py-4">الصلة</th>
                    <th className="px-6 py-4">الجنس</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {members.length === 0 ? <tr><td colSpan={4} className="text-center py-8 text-slate-400">لا يوجد أفراد مسجلين.</td></tr> :
                    members.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3 font-medium text-slate-800">{m.fullName}</td>
                      <td className="px-6 py-3 font-mono text-slate-600">{m.identityNumber || '-'}</td>
                      <td className="px-6 py-3 text-slate-600">{m.relation}</td>
                      <td className="px-6 py-3 text-slate-600">{m.gender}</td>
                    </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-indigo-50/30 flex justify-between items-center">
              <div>
                 <h3 className="font-bold text-lg text-indigo-900/80">المساعدات المخصصة للعائلة</h3>
                 <p className="text-xs text-indigo-700/60 mt-1">سجل المشاريع التي استفادت منها هذه العائلة</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-white border-b border-slate-100 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-6 py-4">تاريخ التخصيص</th>
                    <th className="px-6 py-4">المشروع</th>
                    <th className="px-6 py-4">الكمية</th>
                    <th className="px-6 py-4 text-center">الحالة</th>
                    <th className="px-6 py-4">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {disbursements.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-slate-400">لم يتم تخصيص أي مساعدات لهذه العائلة القائمة.</td></tr> :
                    disbursements.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4 text-slate-500">{a.disbursementDate}</td>
                      <td className="px-6 py-4 font-bold text-slate-700">{a.projectName}</td>
                      <td className="px-6 py-4 font-mono text-slate-600">{a.quantity}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold
                          ${a.status === 'مكتمل' ? 'bg-emerald-100 text-emerald-700' : 
                            a.status === 'مؤجل' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{a.notes || '-'}</td>
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
