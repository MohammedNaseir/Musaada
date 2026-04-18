import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LayoutList, Settings, HeartHandshake, BarChart3, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-50 text-slate-800 rtl font-sans" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-l border-gray-100 flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            م
          </div>
          <h1 className="font-bold text-xl text-slate-900 tracking-tight">مساعدة</h1>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-2">
          <NavLink to="/dashboard" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm' : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'}`}>
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            لوحة المعلومات
          </NavLink>
          
          <NavLink to="/families" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm' : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'}`}>
            <Users className="w-5 h-5 flex-shrink-0" />
            سجل العائلات
          </NavLink>
          
          <NavLink to="/projects" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm' : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'}`}>
            <LayoutList className="w-5 h-5 flex-shrink-0" />
            المشاريع الإغاثية
          </NavLink>

          <NavLink to="/allocations" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-emerald-500 text-white font-semibold shadow-sm' : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'}`}>
            <HeartHandshake className="w-5 h-5 flex-shrink-0" />
            تخصيص مساعدات
          </NavLink>
          
          <NavLink to="/reports" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-emerald-500 text-white font-semibold shadow-sm' : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'}`}>
            <BarChart3 className="w-5 h-5 flex-shrink-0" />
            التقارير
          </NavLink>
          
          <NavLink to="/settings" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-emerald-500 text-white font-semibold shadow-sm' : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'}`}>
            <Settings className="w-5 h-5 flex-shrink-0" />
            إعدادات النظام
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center px-8 z-10 sticky top-0 justify-between">
          <h2 className="text-lg font-bold text-slate-700">نظام إدارة المستفيدين والمساعدات</h2>
          <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
             <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-600">
                <Users className="w-4 h-4"/>
             </div>
             {user?.name || 'مشرف النظام'}
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8 relative z-0">
          <div className="max-w-7xl mx-auto w-full h-full">
             <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
