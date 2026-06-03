import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  TrendingUp,
  Flame,
  Trophy,
  Eye,
  EyeOff,
  Loader2,
  Layers,
  Award,
  ChevronRight,
  X,
  CheckCircle,
} from "lucide-react";
import { useDataStore } from "../../store/dataStore";
import { useFlashcardStore } from "../../store/flashcardStore";

// Danh sách tháng (có icon nhẹ)
const MONTHS = [
  { id: 0, name: "Tháng 1", icon: "" },
  { id: 1, name: "Tháng 2", icon: "" },
  { id: 2, name: "Tháng 3", icon: "" },
  { id: 3, name: "Tháng 4", icon: "" },
  { id: 4, name: "Tháng 5", icon: "" },
  { id: 5, name: "Tháng 6", icon: "" },
  { id: 6, name: "Tháng 7", icon: "" },
  { id: 7, name: "Tháng 8", icon: "" },
  { id: 8, name: "Tháng 9", icon: "" },
  { id: 9, name: "Tháng 10", icon: "" },
  { id: 10, name: "Tháng 11", icon: "" },
  { id: 11, name: "Tháng 12", icon: "" },
];

const StreakPage = () => {
  const navigate = useNavigate();
  const { streakData, fetchStreak, loading } = useDataStore();
  const { flashcardSets, fetchFlashcardSets } = useFlashcardStore();
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // eslint-disable-next-line no-unused-vars
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const {
    current_streak = 0,
    longest_streak = 0,
    activity_dates = [],
    achievements = [],
  } = streakData || {};

  const loadData = useCallback(async () => {
    await fetchStreak();
    await fetchFlashcardSets();
  }, [fetchStreak, fetchFlashcardSets]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lọc danh sách theo chế độ "Xem tất cả" hoặc "Chỉ đã đạt"
  const filteredAchievements = useMemo(() => {
    return showAllAchievements
      ? achievements
      : achievements.filter((a) => a.achieved);
  }, [achievements, showAllAchievements]);

  // Sắp xếp: streak trước, total_vocab sau; trong mỗi loại tăng dần theo requirement_value
  const sortedAchievements = useMemo(() => {
    return [...filteredAchievements].sort((a, b) => {
      const order = { streak: 1, total_vocab: 2 };
      const orderA = order[a.requirement_type] ?? 3;
      const orderB = order[b.requirement_type] ?? 3;
      if (orderA !== orderB) return orderA - orderB;
      return (a.requirement_value || 0) - (b.requirement_value || 0);
    });
  }, [filteredAchievements]);

  const totalFlashcardSets = flashcardSets.length;
  const totalFlashcardItems = flashcardSets.reduce((sum, set) => sum + (set.item_count || 0), 0);
  const totalMemorizedItems = flashcardSets.reduce((sum, set) => sum + (set.memorized_count || 0), 0);

  const isSameDate = (date1, date2) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const calendarData = useMemo(() => {
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
    const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    let startDayOfWeek = firstDayOfMonth.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const weeks = [];
    let day = 1;
    for (let w = 0; w < 6; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        if (w === 0 && d < startDayOfWeek) {
          const prevDate = new Date(selectedYear, selectedMonth, 1 - (startDayOfWeek - d));
          week.push({
            day: prevDate.getDate(),
            date: prevDate,
            currentMonth: false,
            activity: activity_dates.includes(prevDate.toLocaleDateString("sv-SE")),
            isToday: isSameDate(prevDate, new Date()),
          });
        } else if (day <= daysInMonth) {
          const currentDate = new Date(selectedYear, selectedMonth, day);
          week.push({
            day: day,
            date: currentDate,
            currentMonth: true,
            activity: activity_dates.includes(currentDate.toLocaleDateString("sv-SE")),
            isToday: isSameDate(currentDate, new Date()),
          });
          day++;
        } else {
          const nextDate = new Date(selectedYear, selectedMonth + 1, day - daysInMonth);
          week.push({
            day: nextDate.getDate(),
            date: nextDate,
            currentMonth: false,
            activity: activity_dates.includes(nextDate.toLocaleDateString("sv-SE")),
            isToday: isSameDate(nextDate, new Date()),
          });
          day++;
        }
      }
      weeks.push(week);
      if (day > daysInMonth + 7) break;
    }
    return weeks;
  }, [selectedYear, selectedMonth, activity_dates]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFDFD]">
        <Loader2 className="w-10 h-10 text-[#E85A4F] animate-spin mb-4" />
        <p className="text-base text-[#8E8D8A]">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans pb-28 text-[#2D2D2D]">
      {/* Header */}
      <div className="bg-[#FEE9E7] px-6 pt-10 pb-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#4A4A4A] shadow-md"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Streak & Thành tựu</h1>
        </div>

        {/* Streak card */}
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#E85A4F] rounded-2xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#8E8D8A] uppercase tracking-wider">Hiện tại</p>
                <p className="text-2xl font-bold">{current_streak} ngày</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 bg-[#FEE9E7] px-3 py-1.5 rounded-full">
                <Award className="w-4 h-4 text-[#E85A4F]" />
                <span className="text-xs font-bold text-[#E85A4F]">Kỷ lục: {longest_streak}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thống kê Flashcard */}
      <div className="px-6 -mt-4">
        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-50">
          <h2 className="text-base font-bold flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-[#E85A4F]" />
            Thống kê học tập
          </h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[11px] font-medium text-[#8E8D8A] mb-1">Bộ thẻ</p>
              <p className="text-xl font-bold">{totalFlashcardSets}</p>
            </div>
            <div className="border-x border-gray-100">
              <p className="text-[11px] font-medium text-[#8E8D8A] mb-1">Tổng thẻ</p>
              <p className="text-xl font-bold">{totalFlashcardItems}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#8E8D8A] mb-1">Đã nhớ</p>
              <p className="text-xl font-bold text-[#E85A4F]">{totalMemorizedItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Section - đã bỏ icon lịch, thay select bằng bottom sheet */}
      <div className="px-6 mb-8 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold">Lịch học</h2>
          <button
            onClick={() => setIsSheetOpen(true)}
            className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-2 shadow-sm active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#2D2D2D]">
                {MONTHS[selectedMonth].name}
              </span>
            </div>
            <ChevronRight size={16} className="text-gray-300 ml-1" />
          </button>
        </div>

        <div className="bg-white rounded-4xl p-5 shadow-sm border border-gray-100">
          <div className="grid grid-cols-7 gap-1 mb-4">
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
              <div key={d} className="text-xs font-bold text-[#CCC] text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="space-y-1">
            {calendarData.map((week, idx) => (
              <div key={idx} className="grid grid-cols-7 gap-1">
                {week.map((dayObj, dIdx) => (
                  <div
                    key={dIdx}
                    className={`aspect-square flex items-center justify-center text-sm rounded-xl transition-all
                      ${!dayObj.currentMonth ? "text-gray-200" : "text-[#4A4A4A] font-medium"}
                      ${dayObj.activity ? "bg-[#ff8b81] text-[#E85A4F] font-bold" : ""}
                      ${dayObj.isToday ? "bg-[#E85A4F] text-white shadow-md font-bold scale-105" : ""}
                    `}
                  >
                    {dayObj.day}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Danh hiệu - đã sắp xếp */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#E85A4F]" />
            Danh hiệu
          </h2>
          <button
            onClick={() => setShowAllAchievements(!showAllAchievements)}
            className="text-xs text-[#E85A4F] font-bold flex items-center gap-1"
          >
            {showAllAchievements ? (
              <><EyeOff className="w-4 h-4" /> Thu gọn</>
            ) : (
              <><Eye className="w-4 h-4" /> Xem tất cả</>
            )}
          </button>
        </div>
        
        <div className="space-y-3">
          {sortedAchievements.length > 0 ? (
            sortedAchievements.map((ach) => (
              <div
                key={ach.id}
                className={`bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border transition-all ${
                  ach.achieved ? "border-[#E85A4F]/30" : "border-gray-100 opacity-60"
                }`}
              >
                <div className="w-11 h-11 bg-[#FAF9F8] rounded-xl flex items-center justify-center text-xl">
                  {ach.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold">{ach.name}</h3>
                  <p className="text-xs text-[#8E8D8A] leading-relaxed">{ach.description}</p>
                </div>
                {ach.achieved && (
                  <div className="w-5 h-5 bg-[#E85A4F] rounded-full flex items-center justify-center text-white text-[10px]">
                    ✓
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-[#8E8D8A] py-6">
              Chưa có danh hiệu nào.
            </p>
          )}
        </div>
      </div>

      {/* Nút hành động */}
      <div className="fixed bottom-6 left-0 right-0 px-6">
        <button
          onClick={() => navigate("/camera")}
          className="w-full py-4 bg-[#E85A4F] text-white rounded-2xl text-sm font-bold shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <TrendingUp className="w-5 h-5" />
          Tiếp tục học tập
        </button>
      </div>

      {/* BOTTOM SHEET chọn tháng */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-100 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsSheetOpen(false)}
          />
          <div className="relative w-full max-h-[75vh] bg-white rounded-t-[40px] shadow-2xl flex flex-col animate-slide-up overflow-hidden">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-1" />
            <div className="p-6 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-black text-[#2D2D2D]">Chọn tháng</h3>
              <button
                onClick={() => setIsSheetOpen(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2 pb-10">
              {MONTHS.map((month) => (
                <button
                  key={month.id}
                  onClick={() => {
                    setSelectedMonth(month.id);
                    setIsSheetOpen(false);
                  }}
                  className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all ${
                    selectedMonth === month.id
                      ? "bg-[#FEE9E7] border border-[#E85A4F]/20 shadow-sm"
                      : "bg-[#FAFAFA] active:bg-gray-100"
                  }`}
                >
                  <span className="text-2xl">{month.icon}</span>
                  <span
                    className={`flex-1 text-left font-bold ${
                      selectedMonth === month.id ? "text-[#E85A4F]" : "text-[#4A4A4A]"
                    }`}
                  >
                    {month.name}
                  </span>
                  {selectedMonth === month.id && (
                    <CheckCircle size={20} className="text-[#E85A4F]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CSS animation */}
      <style>
        {`
          @keyframes slide-up {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .animate-slide-up {
            animation: slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          }
        `}
      </style>
    </div>
  );
};

export default StreakPage;