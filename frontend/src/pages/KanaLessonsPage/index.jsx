/* eslint-disable no-unused-vars */
// KanaLessonsPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useKanaStore } from "../../store/kanaStore";
import { ChevronLeft, BookOpen, CheckCircle } from "lucide-react";

const getLessonTypeAndNumber = (name) => {
  if (name.startsWith("Hiragana")) return { type: "hiragana", num: parseInt(name.match(/\d+/)?.[0] || 0, 10) };
  if (name.startsWith("Katakana")) return { type: "katakana", num: parseInt(name.match(/\d+/)?.[0] || 0, 10) };
  if (name.startsWith("Kanji")) return { type: "kanji", num: parseInt(name.match(/\d+/)?.[0] || 0, 10) };
  return { type: "other", num: 0 };
};

const getLevelFromLesson = (lesson) => {
  if (!lesson.kanjis || lesson.kanjis.length === 0) return null;
  const levels = new Set(lesson.kanjis.map(k => k.jlpt_level).filter(Boolean));
  if (levels.size === 1) return [...levels][0];
  return "mixed";
};

const KanaLessonsPage = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { lessons, fetchLessons, loading } = useKanaStore();
  const [activeTab, setActiveTab] = useState("hiragana");
  const [activeLevel, setActiveLevel] = useState("N5");

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const groupedLessons = lessons.reduce((acc, lesson) => {
    const { type } = getLessonTypeAndNumber(lesson.name);
    if (!acc[type]) acc[type] = [];
    acc[type].push(lesson);
    return acc;
  }, { hiragana: [], katakana: [], kanji: [], other: [] });

  Object.keys(groupedLessons).forEach((key) => {
    groupedLessons[key].sort((a, b) => {
      const { num: numA } = getLessonTypeAndNumber(a.name);
      const { num: numB } = getLessonTypeAndNumber(b.name);
      return numA - numB;
    });
  });

  const tabs = [
    { key: "hiragana", label: "Hiragana" },
    { key: "katakana", label: "Katakana" },
    { key: "kanji", label: "Kanji" },
  ];

  const getFilteredLessons = () => {
    let lessonsList = groupedLessons[activeTab] || [];
    if (activeTab === "kanji" && activeLevel !== "all") {
      lessonsList = lessonsList.filter(lesson => {
        const level = getLevelFromLesson(lesson);
        return level === activeLevel;
      });
    }
    return lessonsList;
  };

  const currentLessons = getFilteredLessons();

  const availableLevels = () => {
    const levels = new Set();
    (groupedLessons.kanji || []).forEach(lesson => {
      const lvl = getLevelFromLesson(lesson);
      if (lvl && lvl !== "mixed") levels.add(lvl);
    });
    const order = ["N5", "N4", "N3", "N2", "N1"];
    return [...levels].sort((a, b) => order.indexOf(a) - order.indexOf(b));
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
        {/* Tabs chính */}
        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-[#E0E0E0]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key !== "kanji") setActiveLevel("N5");
              }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
                activeTab === tab.key
                  ? "bg-[#E85A4F] text-white"
                  : "text-[#474747] hover:bg-gray-100"
              }`}
            >
              {tab.label}
              <span className="ml-1 text-xs opacity-80">
                ({groupedLessons[tab.key]?.length || 0})
              </span>
            </button>
          ))}
        </div>

        {/* Sub-tabs cho Kanji */}
        {activeTab === "kanji" && (
          <div className="grid grid-cols-5 gap-2">
            <button
              onClick={() => setActiveLevel("all")}
              className={`py-3 text-sm font-bold rounded-xl transition-colors ${
                activeLevel === "all"
                  ? "bg-[#E85A4F] text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Tất cả
            </button>
            {availableLevels().map(level => {
              const count = (groupedLessons.kanji || []).filter(lesson => {
                const lvl = getLevelFromLesson(lesson);
                return lvl === level;
              }).length;
              return (
                <button
                  key={level}
                  onClick={() => setActiveLevel(level)}
                  className={`py-3 text-sm font-bold rounded-xl transition-colors ${
                    activeLevel === level
                      ? "bg-[#E85A4F] text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {level}
                  <span className="ml-1 text-xs opacity-80">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Danh sách bài học với điều hướng đúng loại */}
        {currentLessons.length > 0 ? (
          currentLessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              activeTab={activeTab}
              onClick={() => {
                // 👉 Điều hướng theo loại bài học
                const basePath = activeTab === "kanji" ? "/kanji-lesson" : "/kana-lesson";
                navigate(`${basePath}/${lesson.id}`);
              }}
            />
          ))
        ) : (
          <div className="text-center py-10 text-[#8E8D8A]">
            {activeTab === "kanji"
              ? `Không có bài học Kanji ${
                  activeLevel !== "all" ? `cấp độ ${activeLevel}` : ""
                }`
              : `Chưa có bài học ${activeTab === "hiragana" ? "Hiragana" : "Katakana"} nào.`}
          </div>
        )}
      </main>
    </div>
  );
};

const LessonCard = ({ lesson, activeTab, onClick }) => {
  const isKanji = activeTab === "kanji";
  const items = isKanji ? lesson.kanjis : lesson.kanas;
  const previewItems = items?.slice(0, 5).map((item) => item.character).join(", ") || "";
  const moreCount = (items?.length || 0) - 5;
  const level = getLevelFromLesson(lesson);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-md overflow-hidden border border-[#E0E0E0] cursor-pointer transition-all hover:shadow-lg"
    >
      <div className="p-5 bg-gradient-to-r from-[#F5F0EB] to-white">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <BookOpen className="w-6 h-6 text-[#E85A4F]" />
              <h2 className="text-xl font-bold text-[#474747]">{lesson.name}</h2>
              {isKanji && level && level !== "mixed" && (
                <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {level}
                </span>
              )}
            </div>
            <div className="text-sm text-[#8E8D8A] mt-1">
              {previewItems}
              {moreCount > 0 && ` +${moreCount}`}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lesson.user_completed && <CheckCircle className="w-5 h-5 text-green-500" />}
            <span className="text-sm text-[#8E8D8A] whitespace-nowrap">
              {items?.length || 0} {isKanji ? "chữ" : "chữ"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanaLessonsPage;