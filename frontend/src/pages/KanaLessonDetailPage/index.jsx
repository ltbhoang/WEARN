// KanaLessonDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKanaStore } from "../../store/kanaStore";
import { ChevronLeft, CheckCircle } from "lucide-react";

const KanaLessonDetailPage = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { lessons, loading } = useKanaStore();
  const [lesson, setLesson] = useState(null);

  useEffect(() => {
    if (lessons.length > 0) {
      const found = lessons.find((l) => String(l.id) === lessonId);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLesson(found || null);
    }
  }, [lessons, lessonId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85A4F]"></div>
        <p className="mt-4 text-[#8E8D8A]">Đang tải...</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-[#FAF9F8] flex flex-col items-center justify-center p-4">
        <p className="text-gray-600 mb-4">Không tìm thấy bài học với ID: {lessonId}</p>
        <button
          onClick={() => navigate("/kana-lessons")}
          className="bg-gradient-to-r from-[#E85A4F] to-[#E98074] text-white px-6 py-3 rounded-full font-bold shadow-md hover:shadow-xl transition-all hover:scale-105"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F8] font-sans pb-28">
      {/* Header với style mới */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-4 max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-[#474747]" />
          </button>
          <h1 className="text-2xl font-black text-[#474747] tracking-tight">
            {lesson.name}
          </h1>
        </div>
      </header>

      <main className="px-6 max-w-2xl mx-auto py-6 space-y-6">
        {/* Card trạng thái - gradient nhẹ */}
        <div className="bg-white rounded-2xl shadow-md border border-[#E0E0E0] p-5 flex justify-between items-center transition-all hover:shadow-lg">
          <span className="text-[#474747] font-bold text-lg">Trạng thái</span>
          {lesson.user_completed ? (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Đã hoàn thành</span>
            </div>
          ) : (
            <span className="text-[#8E8D8A] bg-gray-100 px-4 py-2 rounded-full font-medium">
              Chưa hoàn thành
            </span>
          )}
        </div>

        {/* Card danh sách chữ cái */}
        <div className="bg-white rounded-2xl shadow-md border border-[#E0E0E0] p-5 transition-all hover:shadow-xl">
          <h2 className="text-xl font-black text-[#474747] mb-4 flex items-center gap-2">
            <span className="bg-gradient-to-r from-[#E85A4F] to-[#E98074] w-1 h-6 rounded-full"></span>
            Danh sách chữ cái
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
            {lesson.kanas?.map((kana) => (
              <div
                key={kana.id}
                onClick={() => navigate(`/kana-practice/${kana.id}`)}
                className="aspect-square rounded-xl bg-white border border-gray-200 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 hover:shadow-lg hover:border-[#E85A4F] group"
              >
                <span className="text-3xl font-black text-[#474747] group-hover:text-[#E85A4F] transition-colors">
                  {kana.character}
                </span>
                <span className="text-xs text-[#8E8D8A] mt-1 font-medium">
                  {kana.romanji}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Nút KIỂM TRA gradient */}
        <div className="flex justify-center pt-4">
          <button
            onClick={() => navigate(`/kana-test/${lesson.id}`)} // nếu có route test
            className="bg-gradient-to-r from-[#E85A4F] to-[#E98074] text-white font-black py-4 px-10 rounded-full shadow-lg transition-all hover:shadow-xl hover:scale-105 text-lg tracking-wide"
          >
            KIỂM TRA
          </button>
        </div>
      </main>

      {/* Bottom Navigation giống Dashboard (nếu cần đồng bộ toàn app) */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-[#D8C3A5]/20 px-4 py-2 shadow-2xl">
        <nav className="flex items-center justify-around max-w-md mx-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex flex-col items-center gap-0.5 text-[#8E8D8A] transition-colors hover:text-[#E85A4F]"
          >
            <Home className="w-6 h-6 stroke-[1.5]" />
            <span className="text-[11px] font-black uppercase tracking-wider">
              Trang chủ
            </span>
          </button>
          <button className="flex flex-col items-center gap-0.5 text-[#8E8D8A] transition-colors hover:text-[#E85A4F]">
            <LayoutGrid className="w-6 h-6 stroke-[1.5]" />
            <span className="text-[11px] font-black uppercase tracking-wider">
              Bộ sưu tập
            </span>
          </button>
          <button className="relative -top-6 w-16 h-16 bg-gradient-to-br from-[#E85A4F] to-[#E98074] rounded-2xl text-white flex items-center justify-center shadow-xl transition-all hover:scale-110 hover:rotate-3 border-4 border-white">
            <Camera className="w-8 h-8 stroke-[1.5]" />
          </button>
          <button
            onClick={() => navigate("/kana-lessons")}
            className="flex flex-col items-center gap-0.5 text-[#E85A4F] transition-colors"
          >
            <GraduationCap className="w-6 h-6 stroke-[1.5]" />
            <span className="text-[11px] font-black uppercase tracking-wider">
              Luyện tập
            </span>
          </button>
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

// Import các icon cần thiết cho bottom nav (nếu chưa có thì thêm vào đầu file)
import { Home, LayoutGrid, Camera, GraduationCap, User } from "lucide-react";

export default KanaLessonDetailPage;