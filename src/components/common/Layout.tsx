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
    `navbar-link flex items-center gap-3 px-4 py-3 rounded-lg ${
      isActive ? 'bg-[var(--primary-100)] text-[var(--primary-500)] font-bold' : ''
    }`;

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] rtl" dir="rtl">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static top-0 bottom-0 right-0 z-50 w-[260px] bg-[var(--bg-secondary)] lg:bg-[var(--white)] shadow-[var(--shadow-line)] flex flex-col shrink-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 pb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary-500)] flex items-center justify-center text-[var(--white)] font-bold">
              م
            </div>
            <h1 className="h5 text-[var(--secondary-500)] mb-0">إغاثة</h1>
          </div>
          <button 
            className="lg:hidden text-[var(--grey-500)] hover:text-[var(--secondary-500)]"
            onClick={closeSidebar}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 mb-4 flex items-center gap-3 border-b border-[var(--grey-200)]">
          <div className="avatar avatar-md border-2 border-[var(--primary-200)]">
            {user?.name?.charAt(0) || 'م'}
          </div>
          <div className="flex flex-col">
            <span className="body-3 font-bold text-[var(--secondary-500)]">{user?.name || 'مشرف النظام'}</span>
            <span className="caption text-[var(--grey-600)]">مدير مساحة العمل</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 flex flex-col gap-1 overflow-y-auto">
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

        <div className="p-4 border-t border-[var(--grey-200)] mt-auto">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-[var(--alert-danger-500)] hover:bg-[var(--alert-danger-100)] body-3 font-bold"
          >
            <LogOut className="w-[18px] h-[18px]" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        <header className="navbar z-10 sticky top-0 border-b border-[var(--grey-200)] px-4 md:px-6">
          <div className="flex-1 flex items-center gap-4">
            <button 
              className="lg:hidden text-[var(--secondary-400)] hover:text-[var(--primary-500)] transition-colors p-1"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="h6 text-[var(--secondary-500)] hidden md:block">
              نظام إدارة المستفيدين والمساعدات
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <span className="badge badge-success">
                مدير النظام
             </span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6 relative z-0 bg-[var(--bg-primary)]">
          <div className="max-w-[1440px] mx-auto w-full h-full">
             <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
