import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Type, 
  Book, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  ChevronDown 
} from 'lucide-react';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, link: '/admin' },
    { label: 'Từ vựng', icon: <BookOpen className="w-5 h-5" />, link: '/admin/vocabularies' },
    { label: 'Bài học', icon: <Book className="w-5 h-5" />, link: '/admin/lessons' },
    { label: 'Kanji', icon: <Type className="w-5 h-5" />, link: '/admin/kanjis' }, // ← Đã đổi
    { label: 'Người dùng', icon: <Users className="w-5 h-5" />, link: '/admin/users' },
  ];

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800 antialiased">
      
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 fixed top-0 left-0 right-0 h-16 z-40 flex items-center justify-between px-4 md:px-6 shadow-sm shadow-slate-100/40">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-2 hover:bg-slate-50 active:bg-slate-100 rounded-xl text-slate-600 transition-all duration-200"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => navigate('/admin')}>
            <div className="w-8 h-8 rounded-xl bg-[#E85A4F] flex items-center justify-center text-white font-black text-lg shadow-md shadow-[#E85A4F]/20">N</div>
            <span className="text-xl font-bold tracking-tight text-[#E85A4F] hidden sm:block">Nihongo<span className="text-slate-800 font-semibold">Admin</span></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2.5 text-slate-500 hover:text-[#E85A4F] hover:bg-[#E85A4F]/5 rounded-xl relative transition-all duration-200 group">
            <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
          </button>
          
          <div className="flex items-center gap-3 pl-3 border-l border-slate-100 cursor-pointer group py-1">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
                alt="Avatar" 
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-100 group-hover:ring-[#E85A4F]/30 transition-all duration-300"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-bold text-slate-700 leading-none group-hover:text-[#E85A4F] transition-colors">Admin Cute</p>
              <p className="text-[11px] text-slate-400 font-medium mt-1">Quản trị viên cấp cao</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors hidden md:block" />
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 pt-16 relative overflow-hidden">
        
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <aside className={`fixed top-16 bottom-0 left-0 bg-white border-r border-slate-100 w-64 z-30 
          transform transition-transform duration-300 ease-in-out flex flex-col justify-between shadow-xl shadow-slate-100/40 md:shadow-none
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          
          <div className="p-4 space-y-1.5 flex-1 overflow-y-auto">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.link;
              return (
                <button
                  key={index}
                  onClick={() => {
                    navigate(item.link);
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                    ${isActive 
                      ? 'bg-[#E85A4F]/10 text-[#E85A4F] shadow-sm shadow-[#E85A4F]/5' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <div className={`transition-transform duration-200 ${isActive ? 'scale-110 text-[#E85A4F]' : 'text-slate-400'}`}>
                    {item.icon}
                  </div>
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-50">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50/60 active:bg-rose-50 transition-all duration-200"
            >
              <LogOut className="w-5 h-5 text-rose-500" />
              Đăng xuất
            </button>
          </div>
        </aside>

        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'md:pl-64' : 'md:pl-0'}`}>
          
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
            <Outlet />
          </main>

          <footer className="bg-white border-t border-slate-100 py-4 px-6 text-center text-xs font-medium text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© 2026 Hệ thống Học Tiếng Nhật Nihongo. Bảo lưu mọi quyền.</p>
            <div className="flex gap-4 font-semibold">
              <a href="#" className="hover:text-[#E85A4F] transition-colors">Điều khoản</a>
              <a href="#" className="hover:text-[#E85A4F] transition-colors">Bảo mật</a>
            </div>
          </footer>
        </div>

      </div>
    </div>
  );
};

export default AdminLayout;