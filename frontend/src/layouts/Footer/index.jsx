import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  LayoutGrid,
  Camera,
  GraduationCap,
  User,
} from "lucide-react";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (path) => {
    navigate(path);
  };

  // Kiểm tra active: so sánh chính xác hoặc route con
  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    if (path === "/collection") {
      return location.pathname === "/collection" || location.pathname.startsWith("/collection/");
    }
    if (path === "/practice") {
      return location.pathname === "/practice" || location.pathname.startsWith("/practice/");
    }
    if (path === "/profile") {
      return location.pathname === "/profile" || location.pathname.startsWith("/profile/");
    }
    return location.pathname === path;
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-[#D8C3A5]/20 px-4 py-2 shadow-2xl">
      <nav className="flex items-center justify-around max-w-md mx-auto">
        {/* Home */}
        <button
          onClick={() => handleNavClick("/dashboard")}
          className={`flex flex-col items-center gap-0.5 transition-colors ${
            isActive("/dashboard") ? "text-[#E85A4F]" : "text-[#8E8D8A]"
          } hover:text-[#E85A4F]`}
        >
          <Home className="w-6 h-6 stroke-[1.5]" />
          <span className="text-[11px] font-black uppercase tracking-wider">
            Trang chủ
          </span>
        </button>

        {/* Collection */}
        <button
          onClick={() => handleNavClick("/collection")}
          className={`flex flex-col items-center gap-0.5 transition-colors ${
            isActive("/collection") ? "text-[#E85A4F]" : "text-[#8E8D8A]"
          } hover:text-[#E85A4F]`}
        >
          <LayoutGrid className="w-6 h-6 stroke-[1.5]" />
          <span className="text-[11px] font-black uppercase tracking-wider">
            Bộ sưu tập
          </span>
        </button>

        {/* Scan Button */}
        <button
          onClick={() => handleNavClick("/scan")}
          className="relative -top-6 w-16 h-16 bg-linear-to-br from-[#E85A4F] to-[#E98074] rounded-2xl text-white flex items-center justify-center shadow-xl transition-all hover:scale-110 hover:rotate-3 border-4 border-white"
        >
          <Camera className="w-8 h-8 stroke-[1.5]" />
        </button>

        {/* Practice */}
        <button
          onClick={() => handleNavClick("/streak")}
          className={`flex flex-col items-center gap-0.5 transition-colors ${
            isActive("/streak") ? "text-[#E85A4F]" : "text-[#8E8D8A]"
          } hover:text-[#E85A4F]`}
        >
          <GraduationCap className="w-6 h-6 stroke-[1.5]" />
          <span className="text-[11px] font-black uppercase tracking-wider">
            Luyện tập
          </span>
        </button>

        {/* Profile */}
        <button
          onClick={() => handleNavClick("/profile")}
          className={`flex flex-col items-center gap-0.5 transition-colors ${
            isActive("/profile") ? "text-[#E85A4F]" : "text-[#8E8D8A]"
          } hover:text-[#E85A4F]`}
        >
          <User className="w-6 h-6 stroke-[1.5]" />
          <span className="text-[11px] font-black uppercase tracking-wider">
            Hồ sơ
          </span>
        </button>
      </nav>
    </footer>
  );
};

export default Footer;