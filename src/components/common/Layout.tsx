import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LayoutList, Settings, HeartHandshake, BarChart3, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navLinkClass = ({isActive}: {isActive: boolean}) => 
    `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-[15px] ${
      isActive 
        ? 'bg-[#F0EEFF] text-[#7367F0]' 
        : 'hover:bg-gray-50 text-[#5D596C] hover:text-[#7367F0]'
    }`;

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen bg-[#F4F5FA] text-[#3D3B4A] rtl font-sans" dir="rtl">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#3D3B4A]/50 z-40 lg:hidden"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static top-0 bottom-0 right-0 z-50 w-[260px] bg-white shadow-[2px_0_10px_rgba(0,0,0,0.03)] flex flex-col shrink-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 pb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#7367F0] flex items-center justify-center text-white font-bold shadow-lg shadow-[#7367F0]/30">
              م
            </div>
            <h1 className="font-bold text-xl text-[#7367F0] tracking-tight">إغاثة</h1>
          </div>
          <button 
            className="lg:hidden text-[#A5A3AE] hover:text-[#3D3B4A]"
            onClick={closeSidebar}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 mb-4 flex items-center gap-3 border-b border-[#E6E6E8]">
          <div className="w-10 h-10 rounded-full bg-[#F0EEFF] border-2 border-[#7367F0]/20 flex items-center justify-center text-[#7367F0] font-bold">
            {user?.name?.charAt(0) || 'م'}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#3D3B4A]">{user?.name || 'مشرف النظام'}</span>
            <span className="text-xs text-[#A5A3AE]">مدير مساحة العمل</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 flex flex-col gap-1.5 overflow-y-auto">
          <NavLink to="/dashboard" onClick={closeSidebar} className={navLinkClass}>
            <LayoutDashboard className="w-[18px] h-[18px] flex-shrink-0" />
            لوحة المعلومات
          </NavLink>
          
          <NavLink to="/families" onClick={closeSidebar} className={navLinkClass}>
            <Users className="w-[18px] h-[18px] flex-shrink-0" />
            سجل العائلات
          </NavLink>
          
          <NavLink to="/projects" onClick={closeSidebar} className={navLinkClass}>
            <LayoutList className="w-[18px] h-[18px] flex-shrink-0" />
            المشاريع الإغاثية
          </NavLink>

          <NavLink to="/allocations" onClick={closeSidebar} className={navLinkClass}>
            <HeartHandshake className="w-[18px] h-[18px] flex-shrink-0" />
            تخصيص مساعدات
          </NavLink>
          
          <NavLink to="/reports" onClick={closeSidebar} className={navLinkClass}>
            <BarChart3 className="w-[18px] h-[18px] flex-shrink-0" />
            التقارير
          </NavLink>
          
          <NavLink to="/settings" onClick={closeSidebar} className={navLinkClass}>
            <Settings className="w-[18px] h-[18px] flex-shrink-0" />
            إعدادات النظام
          </NavLink>
        </nav>

        <div className="p-4 border-t border-[#E6E6E8] mt-auto">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-[#EA5455] hover:bg-[#EA5455]/10 font-medium text-[15px]"
          >
            <LogOut className="w-[18px] h-[18px]" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        <header className="h-16 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.08)] flex items-center px-4 md:px-6 z-10 sticky top-0 justify-between">
          <div className="flex-1 flex items-center">
            <button 
              className="lg:hidden text-[#5D596C] hover:text-[#7367F0] transition-colors p-2 -ml-2"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
          <h2 className="text-[15px] sm:text-[18px] font-bold text-[#3D3B4A] flex-[2] text-center truncate px-2">
            نظام إدارة المستفيدين والمساعدات
          </h2>
          <div className="flex-1 flex justify-end items-center gap-3">
             <span className="px-3 py-1.5 rounded-full bg-[#E8F9F0] text-[#28C76F] text-[10px] md:text-xs font-bold whitespace-nowrap">
                مدير النظام
             </span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6 relative z-0 bg-[#F4F5FA]">
          <div className="max-w-[1440px] mx-auto w-full h-full">
             <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
