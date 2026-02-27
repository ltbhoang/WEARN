import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Calendar,
  TrendingUp,
  Flame,
  Trophy,
  Eye,
  EyeOff,
} from "lucide-react";
// 1. Import store
import { useDataStore } from "../../store/dataStore"; // Import Store xịn

const StreakPage = () => {
  const navigate = useNavigate();

  // 2. Lấy data và action từ store
  const { streakData, fetchStreak, loading } = useDataStore();
  // Destructure để lấy các trường chi tiết
  const { 
    current_streak, 
    longest_streak, 
    // eslint-disable-next-line no-unused-vars
    total_vocab_learned, 
    stats, 
    activity_dates, 
    achievements 
  } = streakData;

  // 3. Gọi action fetch dữ liệu khi component mount
  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  // State hiển thị tất cả danh hiệu hay chỉ đã đạt
  const [showAllAchievements, setShowAllAchievements] = React.useState(false);

  // 4. Lọc danh hiệu hiển thị dựa trên data từ store
  const displayedAchievements = showAllAchievements
    ? achievements
    : achievements.filter((a) => a.achieved);

  // Lấy thông tin tháng hiện tại
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11
  const currentDate = today.getDate();

  // Tạo dữ liệu lịch cho tháng hiện tại
  const calendarData = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    let startDayOfWeek = firstDayOfMonth.getDay(); 
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const weeks = [];
    let day = 1;
    for (let w = 0; w < 6; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        if (w === 0 && d < startDayOfWeek) {
          const prevMonthDate = new Date(currentYear, currentMonth, 1 - (startDayOfWeek - d));
          week.push(prevMonthDate.getDate());
        } else if (day <= daysInMonth) {
          week.push(day);
          day++;
        } else {
          const nextMonthDate = new Date(currentYear, currentMonth + 1, day - daysInMonth);
          week.push(nextMonthDate.getDate());
          day++;
        }
      }
      weeks.push(week);
      if (day > daysInMonth + 7) break;
    }
    return weeks;
  }, [currentYear, currentMonth]);

  // Hàm lấy đối tượng Date từ vị trí trong lịch
  const getDateFromPosition = (weekIndex, dayIndex) => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startDayOfWeek = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    let dayOfMonth;
    let year = currentYear;
    let month = currentMonth;

    if (weekIndex === 0 && dayIndex < startDayOfWeek) {
      dayOfMonth = new Date(currentYear, currentMonth, 1 - (startDayOfWeek - dayIndex)).getDate();
      month = currentMonth - 1;
      if (month < 0) {
        month = 11;
        year = currentYear - 1;
      }
      return new Date(year, month, dayOfMonth);
    } else {
      const dayIndexInMonth = weekIndex * 7 + dayIndex - startDayOfWeek + 1;
      if (dayIndexInMonth <= daysInMonth) {
        return new Date(currentYear, currentMonth, dayIndexInMonth);
      } else {
        dayOfMonth = dayIndexInMonth - daysInMonth;
        month = currentMonth + 1;
        if (month > 11) {
          month = 0;
          year = currentYear + 1;
        }
        return new Date(year, month, dayOfMonth);
      }
    }
  };

  // Kiểm tra ngày có phải hôm nay không
  const isToday = (weekIndex, dayIndex) => {
    const dateObj = getDateFromPosition(weekIndex, dayIndex);
    return (
      dateObj.getDate() === currentDate &&
      dateObj.getMonth() === currentMonth &&
      dateObj.getFullYear() === currentYear
    );
  };

  // 5. Kiểm tra ngày có hoạt động (So sánh với data từ store)
  const hasActivity = (weekIndex, dayIndex) => {
    const dateObj = getDateFromPosition(weekIndex, dayIndex);
    // Format ngày thành YYYY-MM-DD để so sánh
    const dateString = dateObj.toLocaleDateString('sv-SE'); 
    return activity_dates.includes(dateString);
  };

  // Định dạng tháng năm
  const monthYearString = `Tháng ${currentMonth + 1} ${currentYear}`;

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center">Đang tải dữ liệu...</div>
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans pb-28">
      {/* Header */}
      <div className="bg-[#FEE9E7] px-6 pt-10 pb-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#4A4A4A] shadow-md"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Streak & Thành tựu</h1>
        </div>

        {/* Streak card - Dùng Data từ Store */}
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#E85A4F] rounded-2xl flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-[#8E8D8A]">Chuỗi ngày hiện tại</p>
              <p className="text-3xl font-bold text-[#2D2D2D]">{current_streak} ngày</p>
            </div>
          </div>
          <p className="text-[#8E8D8A] italic">Kỷ lục cao nhất: {longest_streak} ngày 🔥</p>
        </div>
      </div>

      {/* Stats grid - Dùng Data từ Store */}
      <div className="px-6 -mt-4">
        <div className="bg-white rounded-2xl p-5 grid grid-cols-2 gap-4 shadow-md">
          <div>
            <p className="text-xs text-[#8E8D8A]">Đã học</p>
            <p className="text-xl font-bold text-[#2D2D2D]">{stats.total_learned} từ</p>
          </div>
          <div>
            <p className="text-xs text-[#8E8D8A]">Tỷ lệ thuộc</p>
            <p className="text-xl font-bold text-[#E85A4F]">{stats.percent_complete}%</p>
          </div>
          <div>
            <p className="text-xs text-[#8E8D8A]">Đã thuộc</p>
            <p className="text-xl font-bold text-[#2D2D2D]">{stats.memorized}</p>
          </div>
          <div>
            <p className="text-xs text-[#8E8D8A]">Cần ôn</p>
            <p className="text-xl font-bold text-[#2D2D2D]">{stats.need_review}</p>
          </div>
        </div>
      </div>

      {/* Lịch tháng */}
      <div className="px-6 mt-6">
        <h2 className="text-lg font-bold text-[#2D2D2D] mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#E85A4F]" />
          {monthYearString}
        </h2>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          {/* Thứ */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-[#8E8D8A] mb-2">
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>
          {/* Ngày */}
          {calendarData.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1 mb-1">
              {week.map((date, dayIndex) => {
                const todayFlag = isToday(weekIndex, dayIndex);
                const activityFlag = hasActivity(weekIndex, dayIndex);
                return (
                  <div
                    key={dayIndex}
                    className={`aspect-square flex items-center justify-center text-sm rounded-full
                      ${todayFlag ? "bg-[#E85A4F] text-white font-bold" : ""}
                      ${activityFlag && !todayFlag ? "bg-[#FEE9E7] text-[#E85A4F]" : ""}
                      ${!activityFlag && !todayFlag ? "text-[#4A4A4A]" : ""}
                    `}
                  >
                    {date}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Danh hiệu */}
      <div className="px-6 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[#2D2D2D] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#E85A4F]" />
            Danh hiệu
          </h2>
          <button
            onClick={() => setShowAllAchievements(!showAllAchievements)}
            className="text-sm text-[#E85A4F] font-medium flex items-center gap-1"
          >
            {showAllAchievements ? (
              <>
                <EyeOff className="w-4 h-4" />
                Chỉ đã đạt
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Xem tất cả
              </>
            )}
          </button>
        </div>
        <div className="space-y-3">
          {displayedAchievements.map((ach) => (
            <div
              key={ach.id}
              className={`bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border ${
                ach.achieved ? "border-[#E85A4F]" : "border-gray-100 opacity-60"
              }`}
            >
              <div className="w-12 h-12 bg-[#FAF9F8] rounded-xl flex items-center justify-center text-2xl">
                {ach.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#2D2D2D]">{ach.name}</h3>
                <p className="text-xs text-[#8E8D8A]">{ach.description}</p>
                {/* 6. Hiển thị yêu cầu danh hiệu */}
                {!ach.achieved && (
                  <p className="text-xs text-[#E85A4F] mt-1">
                    Yêu cầu: {ach.requirement_value} {ach.requirement_type === 'streak' ? 'ngày' : 'từ'}
                  </p>
                )}
              </div>
              {ach.achieved && (
                <div className="w-6 h-6 bg-[#E85A4F] rounded-full flex items-center justify-center text-white text-xs">
                  ✓
                </div>
              )}
            </div>
          ))}
          {displayedAchievements.length === 0 && (
            <p className="text-center text-[#8E8D8A] py-4">
              Bạn chưa có danh hiệu nào. Hãy chăm chỉ học tập nhé!
            </p>
          )}
        </div>
      </div>

      {/* Nút hành động */}
      <div className="px-6 mt-6">
        <button 
          onClick={() => navigate('/camera')} // Giả sử má có route này
          className="w-full py-4 bg-[#E85A4F] text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Tiếp tục học để nhận danh hiệu
        </button>
      </div>
    </div>
  );
};

export default StreakPage;