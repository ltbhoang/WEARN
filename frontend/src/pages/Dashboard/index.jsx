import React from "react";
import { Home, LayoutGrid, Camera, GraduationCap, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Import icon custom
import ScanHistoryIcon from "../../components/icons/ScanHistoryIcon";
import StoryModeIcon from "../../components/icons/StoryModeIcon";
import PracticeIcon from "../../components/icons/PracticeIcon";
import { useAuthStore } from "../../store/authStore";

const Dashboard = () => {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  return (
    <div className="min-h-screen bg-[#FAF9F8] pb-28 font-sans">
      {/* Header giữ nguyên */}
      <header className="px-6 pt-12 pb-8">
        <div className="flex items-center gap-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center text-4xl transform -rotate-6">
            🦊
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#474747] leading-tight">
              Xin chào,{" "}
              <span className="text-[#E85A4F]">{user?.username || "Bạn"}</span>
            </h1>
            <p className="text-base text-[#8E8D8A] font-medium mt-1">
              Cùng học điều gì đó mới mẻ nào
            </p>
          </div>
        </div>
      </header>

      <main className="px-6 max-w-2xl mx-auto space-y-5">

         {/* Kana Practice Card */}
        <section
          onClick={() => navigate("/kana-lessons")}
          className="group relative overflow-hidden rounded-[2.5rem] bg-linear-to-br from-[#D8B4A0] to-[#C49A8C] p-7 text-white shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02] cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <h2 className="text-3xl font-black tracking-tight">
                Luyện tập Kana
              </h2>
              <p className="text-base font-medium opacity-90 max-w-45">
                Khởi đầu với tiếng bảng chữ cái tiếng Nhật
              </p>
              <button className="mt-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-black text-sm inline-flex items-center gap-2 transition-all hover:bg-white/30">
                Bắt đầu →
              </button>
            </div>
            <StoryModeIcon
              size={160}
              className="opacity-90 drop-shadow-lg ml-5"
            />
          </div>
        </section>

        {/* Scan History Card */}
        <section 
        onClick={() => navigate("/topics")}
        className="group relative overflow-hidden rounded-[2.5rem] bg-linear-to-br from-[#E98074] to-[#ff9189] p-7 text-white shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <h2 className="text-3xl font-black tracking-tight">
                Học từ vựng
              </h2>
              <p className="text-base font-medium opacity-90 max-w-45">
                Khám phá các chủ đề và ghi nhớ từ mới mỗi ngày
              </p>
              <button className="mt-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-black text-sm inline-flex items-center gap-2 transition-all hover:bg-white/30">
                Xem →
              </button>
            </div>
            <ScanHistoryIcon size={120} className="opacity-90 drop-shadow-lg" />
          </div>
        </section>

        {/* Practice Card */}
        <section
          onClick={() => navigate("/flashcard")}
          className="group relative overflow-hidden rounded-[2.5rem] bg-linear-to-br from-[#A5A58D] to-[#8E8D8A] p-7 text-white shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02]"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <h2 className="text-3xl font-black tracking-tight">Luyện tập</h2>
              <p className="text-base font-medium opacity-90 max-w-50">
                Học từ vựng thông qua flashcard
              </p>
              <button className="mt-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-black text-sm inline-flex items-center gap-2 transition-all hover:bg-white/30">
                Luyện tập →
              </button>
            </div>
            <PracticeIcon size={120} className="opacity-90 drop-shadow-lg" />
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-[#D8C3A5]/20 px-4 py-2 shadow-2xl">
        <nav className="flex items-center justify-around max-w-md mx-auto">
          {/* Home */}
          <button className="flex flex-col items-center gap-0.5 text-[#E85A4F] transition-colors hover:text-[#E98074]">
            <Home className="w-6 h-6 stroke-[1.5]" />
            <span className="text-[11px] font-black uppercase tracking-wider">
              Trang chủ
            </span>
          </button>

          {/* Collection */}
          <button className="flex flex-col items-center gap-0.5 text-[#8E8D8A] transition-colors hover:text-[#E85A4F]">
            <LayoutGrid className="w-6 h-6 stroke-[1.5]" />
            <span className="text-[11px] font-black uppercase tracking-wider">
              Bộ sưu tập
            </span>
          </button>

          {/* Scan Button */}
          <button className="relative -top-6 w-16 h-16 bg-linear-to-br from-[#E85A4F] to-[#E98074] rounded-2xl text-white flex items-center justify-center shadow-xl transition-all hover:scale-110 hover:rotate-3 border-4 border-white">
            <Camera className="w-8 h-8 stroke-[1.5]" />
          </button>

          {/* Practice */}
          <button className="flex flex-col items-center gap-0.5 text-[#8E8D8A] transition-colors hover:text-[#E85A4F]">
            <GraduationCap className="w-6 h-6 stroke-[1.5]" />
            <span className="text-[11px] font-black uppercase tracking-wider">
              Luyện tập
            </span>
          </button>

          {/* Profile */}
          <button className="flex flex-col items-center gap-0.5 text-[#8E8D8A] transition-colors hover:text-[#E85A4F]">
            <User className="w-6 h-6 stroke-[1.5]" />
            <span className="text-[11px] font-black uppercase tracking-wider">
              Hồ sơ
            </span>
          </button>
        </nav>
      </footer>
    </div>
  );
};

export default Dashboard;

