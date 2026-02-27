import React from "react";
import { useNavigate } from "react-router-dom"; // Import hook điều hướng

export default function Header({ onMenuClick }) {
  const navigate = useNavigate(); // Khởi tạo navigate

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all">
      {/* Left - Logo & Menu */}
      <div className="flex items-center gap-3">
        {/* Menu Button - Chỉ hiện trên Mobile */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-[#474747]">menu</span>
        </button>

        {/* Logo - Click để về trang chủ */}
        <div 
          onClick={() => navigate("/")}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-9 h-9 bg-[#E85A4F] rounded-xl flex items-center justify-center shadow-lg shadow-[#E85A4F]/20 group-hover:rotate-6 transition-transform">
            <span className="text-white text-base font-black italic">W</span>
          </div>
          <span className="text-xl font-black text-[#474747] tracking-tighter uppercase italic hidden sm:inline">
            Wearn<span className="text-[#E85A4F]">.</span>
          </span>
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate("/login")} // Click để qua trang Login
          className="px-6 py-2.5 text-sm font-black text-white bg-[#474747] hover:bg-[#E85A4F] rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all uppercase tracking-wider"
        >
          Sign In
        </button>
      </div>
    </header>
  );
}