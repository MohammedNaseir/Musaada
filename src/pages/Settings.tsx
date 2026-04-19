import { useState, useEffect } from 'react';
import { assistanceTypesService, sourcesService, assigneesService } from '../services';
import { AssistanceType, Source, Assignee } from '../models/types';
import { Plus, Trash2, CheckCircle2, XCircle, LayoutGrid, Building, UserCircle, X, Loader2 } from 'lucide-react';

export default function Settings() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addType, setAddType] = useState<'type' | 'source' | 'assignee' | null>(null);
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [types, setTypes] = useState<AssistanceType[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [activeTab, setActiveTab] = useState<'types' | 'sources' | 'assignees'>('types');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [t, s, a] = await Promise.all([
      assistanceTypesService.getAll(),
      sourcesService.getAll(),
      assigneesService.getAll()
    ]);
    setTypes(t);
    setSources(s);
    setAssignees(a);
  };

  const handleAddEntity = (type: 'type' | 'source' | 'assignee') => {
    setAddType(type);
    setNewName('');
    setIsAddModalOpen(true);
  };

  const confirmAddEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !addType) return;
    setIsSubmitting(true);
    try {
      if (addType === 'type') await assistanceTypesService.add({ name: newName, isActive: true, description: '' });
      if (addType === 'source') await sourcesService.add({ name: newName, isActive: true, description: '' });
      if (addType === 'assignee') await assigneesService.add({ name: newName, isActive: true, notes: '' });
      await loadData();
      setIsAddModalOpen(false);
    } catch (e: any) { alert(e.message); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteEntity = async (type: 'type' | 'source' | 'assignee', id: number) => {
    if(window.confirm('هل أنت متأكد من الحذف؟')) {
      if (type === 'type') await assistanceTypesService.delete(id);
      if (type === 'source') await sourcesService.delete(id);
      if (type === 'assignee') await assigneesService.delete(id);
      loadData();
    }
  };

  const renderTable = (data: any[], type: 'type' | 'source' | 'assignee') => (
    <div className="bg-white rounded-xl shadow-[0_4px_24px_rgba(34,41,47,0.08)] overflow-hidden animate-in fade-in slide-in-from-bottom-2">
      <div className="flex justify-between items-center px-6 py-5 border-b border-[#E6E6E8]">
        <h3 className="font-bold text-lg text-[#3D3B4A]">
          {type === 'type' && 'أنواع المساعدات'}
          {type === 'source' && 'إدارة الجهات المانحة'}
          {type === 'assignee' && 'إدارة المكلفين / اللجان'}
        </h3>
        <button onClick={() => handleAddEntity(type)} className="flex items-center gap-2 px-4 py-2 bg-[#7367F0] text-white rounded-md hover:bg-[#5E50EE] transition text-sm font-medium">
          <Plus className="w-4 h-4"/> إضافة جديد
        </button>
      </div>
      <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
        <table className="w-full text-right text-sm whitespace-nowrap min-w-[500px]">
          <thead className="bg-[#F8F7FA] border-b border-[#E6E6E8] text-[#5D596C] sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 font-semibold uppercase tracking-wider text-xs">الاسم</th>
              <th className="px-6 py-3 border-r border-[#E6E6E8] font-semibold uppercase tracking-wider text-xs">الحالة</th>
              <th className="px-6 py-3 border-r border-[#E6E6E8] font-semibold uppercase tracking-wider text-xs text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E6E8]">
            {data.length === 0 ? <tr><td colSpan={3} className="text-center py-12 text-[#A5A3AE]">لا يوجد بيانات مسجلة.</td></tr> :
              data.map(item => (
              <tr key={item.id} className="hover:bg-[#7367F0]/[0.05] h-[52px]">
                <td className="px-6 py-2 font-medium text-[#7367F0]">{item.name}</td>
                <td className="px-6 py-2 border-r border-[#E6E6E8]/50">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[13px] font-medium
                    ${item.isActive ? 'bg-[#E8F9F0] text-[#28C76F]' : 'bg-[#FCEAEA] text-[#EA5455]'}`}>
                    {item.isActive ? 'نشط' : 'غير نشط'}
                  </span>
                </td>
                <td className="px-6 py-2 border-r border-[#E6E6E8]/50 text-center">
                  <button onClick={() => handleDeleteEntity(type, item.id)} className="p-2 text-[#A5A3AE] hover:text-[#EA5455] transition-colors rounded-md" title="حذف">
                    <Trash2 className="w-[18px] h-[18px]"/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h2 className="text-2xl font-bold text-[#3D3B4A] tracking-tight">إعدادات النظام</h2>
        <p className="text-[#A5A3AE] text-sm mt-1">إدارة القوائم المنسدلة والتصنيفات المستخدمة في النظام.</p>
      </div>
      
      <div className="flex flex-wrap gap-2 animate-in fade-in">
        <button 
          onClick={() => setActiveTab('types')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-md font-medium transition-all text-sm ${activeTab === 'types' ? 'bg-[#7367F0] text-white shadow-md shadow-[#7367F0]/20' : 'bg-white text-[#5D596C] hover:bg-[#F4F5FA] border border-[#DBDADE]'}`}
        >
          <LayoutGrid className="w-4 h-4" /> أنواع المساعدات
        </button>
        <button 
          onClick={() => setActiveTab('sources')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-md font-medium transition-all text-sm ${activeTab === 'sources' ? 'bg-[#7367F0] text-white shadow-md shadow-[#7367F0]/20' : 'bg-white text-[#5D596C] hover:bg-[#F4F5FA] border border-[#DBDADE]'}`}
        >
          <Building className="w-4 h-4" /> الجهات المانحة
        </button>
        <button 
          onClick={() => setActiveTab('assignees')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-md font-medium transition-all text-sm ${activeTab === 'assignees' ? 'bg-[#7367F0] text-white shadow-md shadow-[#7367F0]/20' : 'bg-white text-[#5D596C] hover:bg-[#F4F5FA] border border-[#DBDADE]'}`}
        >
          <UserCircle className="w-4 h-4" /> المكلفين
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'types' && renderTable(types, 'type')}
        {activeTab === 'sources' && renderTable(sources, 'source')}
        {activeTab === 'assignees' && renderTable(assignees, 'assignee')}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-[0_4px_24px_rgba(0,0,0,0.15)] relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 left-4 p-2 text-[#A5A3AE] hover:text-[#3D3B4A] rounded-full transition-colors"><X className="w-5 h-5"/></button>
            <h3 className="text-lg font-bold text-[#3D3B4A] mb-6">إضافة جديد</h3>
            <form onSubmit={confirmAddEntity} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#5D596C] mb-2">
                  {addType === 'type' && 'اسم نوع المساعدة'}
                  {addType === 'source' && 'اسم المصدر (الجهة المانحة)'}
                  {addType === 'assignee' && 'اسم المكلف'}
                </label>
                <input 
                  autoFocus
                  type="text" 
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#DBDADE] rounded-md focus:border-[#7367F0] focus:shadow-[0_0_0_3px_rgba(115,103,240,0.15)] outline-none transition-all text-sm h-[38px] text-[#3D3B4A]"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-[#7367F0] text-white rounded-md font-medium hover:bg-[#5E50EE] transition-colors shadow-sm disabled:opacity-75 flex justify-center items-center h-[38px] text-sm">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ'}
                </button>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2 bg-[#F4F5FA] text-[#5D596C] hover:text-[#3D3B4A] rounded-md font-medium hover:bg-[#E6E6E8] transition-colors h-[38px] text-sm">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
