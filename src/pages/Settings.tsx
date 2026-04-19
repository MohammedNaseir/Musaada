import React, { useState, useEffect } from 'react';
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
    <div className="bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
      <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-lg text-slate-800">
          {type === 'type' && 'أنواع المساعدات'}
          {type === 'source' && 'إدارة الجهات المانحة'}
          {type === 'assignee' && 'إدارة المكلفين / اللجان'}
        </h3>
        <button onClick={() => handleAddEntity(type)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm hover:shadow">
          <Plus className="w-4 h-4"/> إضافة جديد
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
            <tr>
              <th className="px-6 py-4">الاسم</th>
              <th className="px-6 py-4 border-r border-slate-100">الحالة</th>
              <th className="px-6 py-4 border-r border-slate-100 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? <tr><td colSpan={3} className="text-center py-12 text-slate-500">لا يوجد بيانات مسجلة.</td></tr> :
              data.map(item => (
              <tr key={item.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-medium text-slate-800">{item.name}</td>
                <td className="px-6 py-4 border-r border-slate-50">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold
                    ${item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {item.isActive ? <CheckCircle2 className="w-3.5 h-3.5"/> : <XCircle className="w-3.5 h-3.5"/>}
                    {item.isActive ? 'نشط' : 'غير نشط'}
                  </span>
                </td>
                <td className="px-6 py-4 border-r border-slate-50 text-center">
                  <button onClick={() => handleDeleteEntity(type, item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4"/>
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col mb-8 gap-2">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">إعدادات النظام</h2>
        <p className="text-slate-500">إدارة القوائم المنسدلة والتصنيفات المستخدمة في النظام.</p>
      </div>
      
      <div className="flex gap-2 p-1 bg-slate-200/50 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('types')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all text-sm ${activeTab === 'types' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <LayoutGrid className="w-4 h-4" /> أنواع المساعدات
        </button>
        <button 
          onClick={() => setActiveTab('sources')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all text-sm ${activeTab === 'sources' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Building className="w-4 h-4" /> الجهات المانحة
        </button>
        <button 
          onClick={() => setActiveTab('assignees')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all text-sm ${activeTab === 'assignees' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
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
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 left-6 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            <h3 className="text-xl font-extrabold text-slate-800 mb-6">إضافة جديد</h3>
            <form onSubmit={confirmAddEntity} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {addType === 'type' && 'اسم نوع المساعدة'}
                  {addType === 'source' && 'اسم المصدر (الجهة المانحة)'}
                  {addType === 'assignee' && 'اسم المكلف'}
                </label>
                <input 
                  autoFocus
                  type="text" 
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-75 flex justify-center items-center">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ'}
                </button>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
