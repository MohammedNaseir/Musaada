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
    <div className="flex h-[50vh] items-center justify-center text-[var(--secondary-400)]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-500)]"></div>
    </div>
  );
  if (!family) return <div className="text-center p-12 text-[var(--secondary-400)] font-semibold text-lg">لم يتم العثور على العائلة.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/families" className="p-2 bg-[var(--white)] border border-[var(--grey-200)] rounded-md text-[var(--secondary-400)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--primary-500)] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="h4 text-[var(--secondary-500)]">ملف العائلة: {family.headFullName}</h2>
            <p className="body-3 text-[var(--grey-600)] mt-1 font-mono">{family.headIdentityNumber}</p>
          </div>
        </div>
        <Link to={`/families/${id}/edit`} className="btn btn-primary h-[38px] whitespace-nowrap">
          <Edit className="w-4 h-4 mr-2" /> تعديل البيانات
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="card flex flex-col gap-5 p-5">
            <h3 className="h5 text-[var(--secondary-500)]">بيانات الاتصال</h3>
            
            <div className="flex items-center gap-4">
              <div className="p-2 bg-[var(--primary-100)] text-[var(--primary-500)] rounded-md"><User className="w-5 h-5"/></div>
              <div>
                <p className="caption font-semibold text-[var(--grey-500)]">رب الأسرة</p>
                <p className="body-3 font-medium text-[var(--secondary-500)] mt-0.5 w-[140px] truncate" title={family.headFullName}>{family.headFullName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-2 bg-[var(--tertiary-100)] text-[var(--tertiary-500)] rounded-md"><Phone className="w-5 h-5"/></div>
              <div>
                <p className="caption font-semibold text-[var(--grey-500)]">رقم الجوال</p>
                <p className="body-3 font-mono font-medium text-[var(--secondary-500)] mt-0.5" dir="ltr">{family.mobileNumber || 'لا يوجد'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-2 bg-[var(--alert-danger-100)] text-[var(--alert-danger-500)] rounded-md"><MapPin className="w-5 h-5"/></div>
              <div>
                <p className="caption font-semibold text-[var(--grey-500)]">السكن الأصلي</p>
                <p className="body-3 font-medium text-[var(--secondary-500)] mt-0.5">{family.residenceBeforeWar || 'غير متوفر'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-2 bg-[var(--alert-warning-100)] text-[var(--alert-warning-500)] rounded-md"><MapPin className="w-5 h-5"/></div>
              <div>
                <p className="caption font-semibold text-[var(--grey-500)]">منطقة النزوح (حاليا)</p>
                <div className="mt-1 flex flex-col gap-1.5">
                   <p className="body-3 font-medium text-[var(--secondary-500)]">{family.currentResidence}</p>
                   {family.isDisplaced ? (
                     <span className="badge badge-warning text-[10px] w-fit">عائلة نازحة - {family.region || 'غير محدد'}</span>
                   ) : (
                     <span className="badge badge-success text-[10px] w-fit">مقيم (غير نازح) - {family.region || 'غير محدد'}</span>
                   )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-2 bg-[var(--alert-success-100)] text-[var(--alert-success-500)] rounded-md"><Users className="w-5 h-5"/></div>
              <div>
                <p className="caption font-semibold text-[var(--grey-500)]">عدد أفراد العائلة</p>
                <p className="body-3 font-medium text-[var(--secondary-500)] mt-0.5">{family.memberCount + 1} أفراد</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-2 bg-[var(--alert-success-100)] text-[var(--alert-success-500)] rounded-md"><Users className="w-5 h-5"/></div>
              <div>
                <p className="caption font-semibold text-[var(--grey-500)]">الجهة المكلفة</p>
                <p className="body-3 font-medium text-[var(--secondary-500)] mt-0.5">{assignee ? assignee.name : 'غير محدد'}</p>
              </div>
            </div>
          </div>
          
          {family.notes && (
             <div className="bg-[var(--alert-warning-100)]/50 rounded-xl border border-[var(--alert-warning-200)] p-5">
               <h3 className="body-3 font-bold text-[var(--alert-warning-600)] mb-2">ملاحظات</h3>
               <p className="body-4 text-[var(--alert-warning-700)] leading-relaxed">{family.notes}</p>
             </div>
          )}
        </div>

        <div className="md:col-span-3 space-y-6">
          <div className="card p-0 overflow-hidden">
            <div className="card-header border-b border-[var(--grey-200)] px-6 py-5 mb-0 pb-5">
              <h3 className="card-title">أفراد العائلة المرفقين</h3>
              <p className="body-4 text-[var(--grey-500)] mt-1">إجمالي الأفراد: <strong className="text-[var(--secondary-500)]">{family.memberCount + 1}</strong> (رب الأسرة + {family.memberCount} أفراد)</p>
            </div>
            <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
              <table className="table min-w-[500px]">
                <thead className="sticky top-0 z-10 bg-[var(--bg-tertiary)]">
                  <tr>
                    <th>الاسم</th>
                    <th>الهوية</th>
                    <th>الصلة</th>
                    <th>الجنس</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? <tr><td colSpan={4} className="text-center py-8 text-[var(--grey-500)]">لا يوجد أفراد مسجلين.</td></tr> :
                    members.map(m => (
                    <tr key={m.id}>
                      <td className="font-medium text-[var(--primary-500)]">{m.fullName}</td>
                      <td className="font-mono text-[var(--secondary-500)]">{m.identityNumber || '-'}</td>
                      <td className="text-[var(--secondary-500)]">{m.relation}</td>
                      <td className="text-[var(--secondary-500)]">{m.gender}</td>
                    </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="card-header border-b border-[var(--grey-200)] px-6 py-5 mb-0 pb-5">
              <h3 className="card-title">المساعدات المخصصة للعائلة</h3>
              <p className="body-4 text-[var(--grey-500)] mt-1">سجل المشاريع التي استفادت منها هذه العائلة</p>
            </div>
            <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
              <table className="table min-w-[600px]">
                <thead className="sticky top-0 z-10 bg-[var(--bg-tertiary)]">
                  <tr>
                    <th>تاريخ التخصيص</th>
                    <th>المشروع</th>
                    <th>الكمية</th>
                    <th className="text-center">الحالة</th>
                    <th>ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {disbursements.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-[var(--grey-500)] font-medium">لم يتم تخصيص أي مساعدات لهذه العائلة القائمة.</td></tr> :
                    disbursements.map(a => (
                    <tr key={a.id}>
                      <td className="font-mono text-[var(--secondary-500)]">{a.disbursementDate}</td>
                      <td className="font-medium text-[var(--primary-500)]">{a.projectName}</td>
                      <td className="font-mono text-[var(--secondary-500)]">{a.quantity}</td>
                      <td className="text-center">
                        <span className={`badge ${
                          a.status === 'مكتمل' ? 'badge-success' : 
                          a.status === 'مؤجل' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="text-[var(--grey-500)]">{a.notes || '-'}</td>
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
