import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useKanaStore } from "../../store/kanaStore";
import { ChevronLeft, BookOpen, CheckCircle } from "lucide-react";

const getLessonTypeAndNumber = (name) => {
  const isHiragana = name.startsWith("Hiragana");
  const isKatakana = name.startsWith("Katakana");
  const match = name.match(/\d+/);
  const num = match ? parseInt(match[0], 10) : 0;
  return { type: isHiragana ? 0 : isKatakana ? 1 : 2, num };
};

const KanaLessonsPage = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { lessons, fetchLessons, loading } = useKanaStore();

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const sortedLessons = [...lessons].sort((a, b) => {
    const { type: typeA, num: numA } = getLessonTypeAndNumber(a.name);
    const { type: typeB, num: numB } = getLessonTypeAndNumber(b.name);
    if (typeA !== typeB) return typeA - typeB;
    return numA - numB;
  });

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
            onClick={() => navigate(`/kana-lesson/${lesson.id}`)}
          />
        ))}
      </main>
    </div>
  );
};

const LessonCard = ({ lesson, onClick }) => {
  const previewKanas = lesson.kanas.slice(0, 5).map((k) => k.character).join(", ");
  const moreCount = lesson.kanas.length - 5;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-md overflow-hidden border border-[#E0E0E0] cursor-pointer transition-all hover:shadow-lg"
    >
      <div className="p-5 bg-gradient-to-r from-[#F5F0EB] to-white">
        <div className="flex justify-between items-start">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanaLessonsPage;