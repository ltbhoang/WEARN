import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDataStore } from "../../store/dataStore"; // Import Store xịn
import {
  ChevronLeft,
  BookOpen,
  Star,
  Filter,
  Calendar,
  TrendingUp,
  Loader2,
} from "lucide-react";
import WordDetailModal from "../../components/WordDetail";

const WEEKLY_PALETTE = [
  { main: "#E85A4F", bg: "#FEE9E7" }, // CN
  { main: "#E98074", bg: "#FEF0ED" }, // T2
  { main: "#D4A373", bg: "#FEF5E9" }, // T3
  { main: "#A7C4A0", bg: "#F3F9F1" }, // T4
  { main: "#7C9EB2", bg: "#F0F5F9" }, // T5
  { main: "#B185A7", bg: "#F9F2F7" }, // T6
  { main: "#D98C8C", bg: "#FEF2F2" }, // T7
];

const CollectionDetail = () => {
  const { id } = useParams(); // Lấy ID từ URL (ví dụ: /collection/5)
  const navigate = useNavigate();

  // 1. Kết nối Store
  const { fetchCollectionDetail, vocabularies, loading } = useDataStore();
  const [collectionInfo, setCollectionInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);

  // 2. Fetch dữ liệu khi vào trang
  useEffect(() => {
    const loadData = async () => {
      const res = await fetchCollectionDetail(id);
      if (res) setCollectionInfo(res);
    };
    loadData();
  }, [id, fetchCollectionDetail]);

  // 3. Xử lý Theme dựa trên date_key của Collection trả về từ Backend
  const theme = collectionInfo 
    ? WEEKLY_PALETTE[new Date(collectionInfo.date_key).getDay()] 
    : WEEKLY_PALETTE[new Date().getDay()];

  // 4. Lọc items (Map lại data từ Backend sang format giao diện của má)
  const formattedItems = vocabularies.map(v => ({
    id: v.id,
    ja: v.word,
    reading: v.pronunciation,
    romaji: "", // Backend chưa có trường này thì để trống
    vi: v.meaning,
    example: v.example_sentence,
    exampleTranslation: v.example_translation,
    img: v.user_image, // Ảnh má chụp
    memorized: v.is_memorized || false, // Giả sử má có trường này ở Backend
  }));

  const filteredItems = formattedItems.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "memorized") return item.memorized === true;
    if (activeTab === "learning") return item.memorized === false;
    return true;
  });

  const totalWords = formattedItems.length;
  const memorizedCount = formattedItems.filter((i) => i.memorized).length;
  const learningCount = totalWords - memorizedCount;

  // 5. Các hàm xử lý (Tạm thời gọi API hoặc update local tùy má)
  const handleToggleMemorized = (id) => {
     // Sau này má nên viết hàm updateMemorized trong store
     console.log("Toggle memorized cho id:", id);
  };

  // eslint-disable-next-line no-unused-vars
  const handleDeleteWord = (id) => {
     // Dùng hàm removeItem từ store
     // removeItem('vocabularies', id);
  };

  if (loading && !collectionInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">
        <Loader2 className="w-10 h-10 animate-spin text-[#E85A4F]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans pb-28">
      <div className="relative" style={{ backgroundColor: theme.bg }}>
        <div className="px-6 pt-10 pb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm text-[#4A4A4A] shadow-md active:scale-90 transition-transform"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm text-[#4A4A4A]">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {collectionInfo ? new Date(collectionInfo.date_key).toLocaleDateString("vi-VN", { weekday: "long" }) : "..."}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm text-[#4A4A4A]">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{memorizedCount}/{totalWords}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#2D2D2D]">
                {collectionInfo?.title || "Đang tải..."}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span
                  className="px-4 py-1.5 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: theme.main + "20", color: theme.main }}
                >
                  {totalWords} từ vựng
                </span>
                <span className="text-[#8E8D8A] text-sm flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {memorizedCount} đã thuộc
                </span>
              </div>
            </div>
            <div className="w-16 h-16 bg-white/40 backdrop-blur-sm rounded-3xl flex items-center justify-center text-4xl shadow-sm border border-white/50">
              📖
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/40">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${totalWords > 0 ? (memorizedCount / totalWords) * 100 : 0}%`,
              backgroundColor: theme.main,
            }}
          />
        </div>
      </div>

      <div className="px-6 py-5 flex gap-3">
        <button
          className="flex-1 py-3.5 rounded-2xl font-semibold text-white shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ backgroundColor: theme.main }}
        >
          <BookOpen className="w-5 h-5" />
          Luyện tập ngay
        </button>
        <button className="py-3.5 px-5 rounded-2xl border border-[#E0E0E0] font-semibold text-[#8E8D8A] bg-white shadow-sm flex items-center gap-1 active:scale-[0.98] transition-transform">
          <Filter className="w-4 h-4" />
          Lọc
        </button>
      </div>

      {/* Tabs Section */}
      <div className="px-6 border-b border-[#F0F0F0]">
        <div className="flex gap-6">
          {["all", "learning", "memorized"].map((tab) => (
            <button
              key={tab}
              className={`pb-3 text-base font-semibold border-b-2 transition-colors capitalize`}
              style={{
                borderColor: activeTab === tab ? theme.main : "transparent",
                color: activeTab === tab ? theme.main : "#8E8D8A",
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "all" ? "Tất cả" : tab === "learning" ? "Đang học" : "Đã nhớ"} (
              {tab === "all" ? totalWords : tab === "learning" ? learningCount : memorizedCount})
            </button>
          ))}
        </div>
      </div>

      {/* Grid danh sách từ vựng từ Backend */}
      <main className="px-6 mt-6 grid grid-cols-2 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.03)] border border-gray-50 p-3 transition-all active:scale-[0.97] cursor-pointer"
            onClick={() => setSelectedItem(item)}
          >
            <div className="relative">
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-[#F9F9F9]">
                <img
                  src={item.img}
                  alt={item.ja}
                  className="w-full h-full object-cover"
                />
              </div>
              {item.memorized && (
                <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                </div>
              )}
            </div>

            <div className="text-center mt-3">
              <div className="text-lg font-bold text-[#333]">{item.ja}</div>
              <div className="text-xs text-[#888] mt-0.5 line-clamp-1">
                {item.vi}
              </div>
            </div>
          </div>
        ))}
      </main>

      {filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-[#8E8D8A]">
          <p className="text-lg font-medium opacity-50">Bộ sưu tập này chưa có từ nào</p>
        </div>
      )}

      {/* Modal chi tiết - Truyền data thật vào đây */}
      <WordDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onToggleMemorized={handleToggleMemorized}
        onDelete={handleDeleteWord}
      />
    </div>
  );
};

export default CollectionDetail;