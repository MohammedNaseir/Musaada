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
    <div className="card p-0 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
      <div className="flex justify-between items-center px-6 py-5 border-b border-[var(--grey-100)] card-header pb-5 mb-0">
        <h3 className="card-title">
          {type === 'type' && 'أنواع المساعدات'}
          {type === 'source' && 'إدارة الجهات المانحة'}
          {type === 'assignee' && 'إدارة المكلفين / اللجان'}
        </h3>
        <button onClick={() => handleAddEntity(type)} className="btn btn-primary h-[38px] px-4 py-0 text-sm">
          <Plus className="w-4 h-4 mr-2"/> إضافة جديد
        </button>
      </div>
      <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
        <table className="table w-full text-right text-sm whitespace-nowrap min-w-[500px]">
          <thead className="sticky top-0 z-10">
            <tr>
              <th>الاسم</th>
              <th>الحالة</th>
              <th className="text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? <tr><td colSpan={3} className="text-center py-12 text-[var(--grey-400)]">لا يوجد بيانات مسجلة.</td></tr> :
              data.map(item => (
              <tr key={item.id} className="h-[52px]">
                <td className="font-medium text-[var(--primary-500)]">{item.name}</td>
                <td>
                  <span className={`badge
                    ${item.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {item.isActive ? 'نشط' : 'غير نشط'}
                  </span>
                </td>
                <td className="text-center">
                  <button onClick={() => handleDeleteEntity(type, item.id)} className="p-2 text-[var(--grey-400)] hover:text-[var(--alert-danger-500)] transition-colors rounded-md hover:bg-[var(--alert-danger-50)]" title="حذف">
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
        <h2 className="h4 text-[var(--secondary-500)] tracking-tight">إعدادات النظام</h2>
        <p className="body-4 text-[var(--grey-500)] mt-1">إدارة القوائم المنسدلة والتصنيفات المستخدمة في النظام.</p>
      </div>
      
      <div className="flex flex-wrap gap-2 animate-in fade-in">
        <button 
          onClick={() => setActiveTab('types')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-md font-medium transition-all text-sm border ${activeTab === 'types' ? 'bg-[var(--primary-500)] text-[var(--white)] shadow-md border-[var(--primary-600)]' : 'bg-[var(--white)] text-[var(--secondary-500)] hover:bg-[var(--bg-tertiary)] border-[var(--grey-200)]'}`}
        >
          <LayoutGrid className="w-4 h-4" /> أنواع المساعدات
        </button>
        <button 
          onClick={() => setActiveTab('sources')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-md font-medium transition-all text-sm border ${activeTab === 'sources' ? 'bg-[var(--primary-500)] text-[var(--white)] shadow-md border-[var(--primary-600)]' : 'bg-[var(--white)] text-[var(--secondary-500)] hover:bg-[var(--bg-tertiary)] border-[var(--grey-200)]'}`}
        >
          <Building className="w-4 h-4" /> الجهات المانحة
        </button>
        <button 
          onClick={() => setActiveTab('assignees')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-md font-medium transition-all text-sm border ${activeTab === 'assignees' ? 'bg-[var(--primary-500)] text-[var(--white)] shadow-md border-[var(--primary-600)]' : 'bg-[var(--white)] text-[var(--secondary-500)] hover:bg-[var(--bg-tertiary)] border-[var(--grey-200)]'}`}
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
        <div className="fixed inset-0 bg-[var(--secondary-500)]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 left-4 p-2 text-[var(--grey-400)] hover:text-[var(--secondary-500)] hover:bg-[var(--bg-tertiary)] rounded-full transition-colors"><X className="w-5 h-5"/></button>
            <h3 className="h6 text-[var(--secondary-500)] mb-6">إضافة جديد</h3>
            <form onSubmit={confirmAddEntity} className="space-y-4">
              <div className="form-field">
                <label className="form-label mb-2">
                  {addType === 'type' && 'اسم نوع المساعدة'}
                  {addType === 'source' && 'اسم المصدر (الجهة المانحة)'}
                  {addType === 'assignee' && 'اسم المكلف'}
                </label>
                <input 
                  autoFocus
                  type="text" 
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="form-input h-[42px] px-3 w-full"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1 h-[42px]">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ'}
                </button>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-outline flex-1 h-[42px]">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
