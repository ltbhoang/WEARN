import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  LayoutGrid,
  GraduationCap,
  User,
  Settings,
  LogOut,
} from "lucide-react";

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menus = [
    { icon: Home, label: "Trang chủ", path: "/" },
    { icon: LayoutGrid, label: "Bộ sưu tập", path: "/collection" },
    { icon: GraduationCap, label: "Luyện tập", path: "/practice" },
    { icon: User, label: "Hồ sơ", path: "/profile" },
    { icon: Settings, label: "Cài đặt", path: "/settings" },
  ];

  const isActive = (menuPath) => location.pathname === menuPath;

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Overlay cho mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:static left-0 top-0 w-64 h-screen bg-white border-r border-[#D8C3A5]/20 z-40 transition-transform duration-300 md:translate-x-0 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo / Brand */}
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-linear-to-br from-[#E85A4F] to-[#E98074] rounded-lg flex items-center justify-center">
              <span className="text-white font-black italic text-sm">W</span>
            </div>
            <span className="text-xl font-black text-[#E85A4F] tracking-tighter italic uppercase">
              Wearn
            </span>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {menus.map((menu, idx) => {
              const Icon = menu.icon;
              const active = isActive(menu.path);
              return (
                <li key={idx}>
                  <button
                    onClick={() => handleNavigate(menu.path)}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-black transition-all ${
                      active
                        ? "bg-[#E85A4F]/10 text-[#E85A4F]"
                        : "text-[#8E8D8A] hover:bg-[#FAF9F8] hover:text-[#474747]"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 stroke-[1.5] ${
                        active ? "text-[#E85A4F]" : "text-[#8E8D8A]"
                      }`}
                    />
                    <span>{menu.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Divider */}
        <div className="h-px bg-[#D8C3A5]/20 mx-4" />

        {/* Footer / Sign Out */}
        <div className="p-4">
          <button
            onClick={() => {
              // Xử lý đăng xuất
              navigate("/logout");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black text-[#8E8D8A] hover:bg-[#FAF9F8] hover:text-[#E85A4F] transition-colors"
          >
            <LogOut className="w-5 h-5 stroke-[1.5]" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </>
  );
}