import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useKanaStore } from "../../store/kanaStore";
import { ChevronLeft, BookOpen, CheckCircle } from "lucide-react";

// Hàm trả về loại (0: Hiragana, 1: Katakana) và số thứ tự từ tên bài học
const getLessonTypeAndNumber = (name) => {
  const isHiragana = name.startsWith("Hiragana");
  const isKatakana = name.startsWith("Katakana");
  const match = name.match(/\d+/);
  const num = match ? parseInt(match[0], 10) : 0;
  return { type: isHiragana ? 0 : (isKatakana ? 1 : 2), num };
};

const KanaLessonsPage = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { lessons, fetchLessons, loading, fetchKanaProgress, kanaProgress } = useKanaStore();

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  // Sắp xếp bài học: Hiragana trước Katakana, theo số tăng dần
  const sortedLessons = [...lessons].sort((a, b) => {
    const { type: typeA, num: numA } = getLessonTypeAndNumber(a.name);
    const { type: typeB, num: numB } = getLessonTypeAndNumber(b.name);
    if (typeA !== typeB) return typeA - typeB;
    return numA - numB;
  });

  useEffect(() => {
    if (sortedLessons.length > 0) {
      console.log("=== DANH SÁCH BÀI HỌC (ĐÃ SẮP XẾP) ===");
      sortedLessons.forEach((lesson) => {
        const { type, num } = getLessonTypeAndNumber(lesson.name);
        console.log(`Bài: ${lesson.name} (loại: ${type === 0 ? "Hiragana" : "Katakana"}, số: ${num})`);
        console.log("  Thứ tự kana:", lesson.kanas.map((k) => k.character).join(" → "));
      });
    }
  }, [sortedLessons]);

  const handleKanaClick = (kana) => {
    // Chuyển sang trang luyện tập riêng
    navigate(`/kana-practice/${kana.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85A4F] mx-auto"></div>
          <p className="mt-4 text-[#8E8D8A]">Đang tải bài học...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F8] pb-20 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-4 max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-[#474747]" />
          </button>
          <h1 className="text-2xl font-black text-[#474747]">Bảng chữ cái</h1>
        </div>
      </header>

      <main className="px-6 max-w-2xl mx-auto space-y-6 mt-6">
        {sortedLessons.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            onKanaClick={handleKanaClick}
            kanaProgress={kanaProgress}
          />
        ))}
      </main>
    </div>
  );
};

const LessonCard = ({ lesson, onKanaClick, kanaProgress }) => {
  const [expanded, setExpanded] = useState(false);
  const previewKanas = lesson.kanas.slice(0, 5).map((k) => k.character).join(", ");
  const moreCount = lesson.kanas.length - 5;

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-[#E0E0E0]">
      <div
        className="p-5 bg-gradient-to-r from-[#F5F0EB] to-white cursor-pointer flex justify-between items-center"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <BookOpen className="w-6 h-6 text-[#E85A4F]" />
            <h2 className="text-xl font-bold text-[#474747]">{lesson.name}</h2>
          </div>
          <div className="text-sm text-[#8E8D8A] mt-1">
            {previewKanas}
            {moreCount > 0 && ` +${moreCount}`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lesson.user_completed && <CheckCircle className="w-5 h-5 text-green-500" />}
          <span className="text-sm text-[#8E8D8A] whitespace-nowrap">
            {lesson.kanas.length} chữ
          </span>
          <svg
            className={`w-5 h-5 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="p-4 border-t border-gray-100">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {lesson.kanas.map((kana) => {
              const progress = kanaProgress[kana.id];
              const completed = progress ? progress.completed : false;
              return (
                <KanaCard
                  key={kana.id}
                  kana={kana}
                  onClick={() => onKanaClick(kana)}
                  completed={completed}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const KanaCard = ({ kana, onClick, completed }) => {
  return (
    <div
      onClick={onClick}
      className={`relative aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${
        completed
          ? "bg-green-100 border-2 border-green-400"
          : "bg-gray-50 border border-gray-200 hover:border-[#E85A4F]"
      }`}
    >
      {completed && <CheckCircle className="absolute top-1 right-1 w-4 h-4 text-green-500" />}
      <span className="text-3xl font-bold text-[#474747]">{kana.character}</span>
      <span className="text-xs text-[#8E8D8A] mt-1">{kana.romanji}</span>
    </div>
  );
};

export default KanaLessonsPage;