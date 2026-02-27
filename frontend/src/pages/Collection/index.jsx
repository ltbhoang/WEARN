import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDataStore } from "../../store/dataStore";
import {
  Copy,
  ChevronRight,
  Search,
  Loader2,
} from "lucide-react";

const WEEKLY_PALETTE = [
  { main: "#E85A4F", bg: "#FEE9E7" },
  { main: "#E98074", bg: "#FEF0ED" },
  { main: "#D4A373", bg: "#FEF5E9" },
  { main: "#A7C4A0", bg: "#F3F9F1" },
  { main: "#7C9EB2", bg: "#F0F5F9" },
  { main: "#B185A7", bg: "#F9F2F7" },
  { main: "#D98C8C", bg: "#FEF2F2" },
];

const CollectionPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { collections, fetchCollections, loading } = useDataStore();

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const getThemeByDate = (dateString) => {
    const date = new Date(dateString);
    const dayIndex = isNaN(date.getDay()) ? 0 : date.getDay();
    return WEEKLY_PALETTE[dayIndex];
  };

  const filteredCollections = collections.filter((col) =>
    col.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    // Thêm pb-40 để cách footer app chính một khoảng xa
    <div className="min-h-screen bg-[#FAF9F8] pb-40 font-sans text-[#2D2D2D]">
      <header className="px-6 pt-10 pb-4">
        <div className="flex items-center gap-4 max-w-2xl mx-auto">
          <div>
            <h1 className="text-4xl font-black text-[#474747] leading-tight">
              Bộ sưu tập
            </h1>
            <p className="text-base text-[#8E8D8A] font-medium mt-1">
              Bạn đã học được {collections.length} bộ từ rồi!
            </p>
          </div>
          
          <div className="relative w-20 h-20 ml-2">
            <div className="absolute bottom-0 left-0 w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl transform rotate-12 z-10 border border-white">
              🎃
            </div>
            <div className="absolute top-0 left-10 w-16 h-16 bg-[#F9F5F1] rounded-2xl shadow-lg flex items-center justify-center text-4xl transform -rotate-6 z-0 border border-gray-50">
              🐿️
            </div>
          </div>
        </div>

        <div className="mt-4 relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#8E8D8A] z-10" />
          <input
            type="text"
            placeholder="Tìm kiếm bộ sưu tập..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-[#D8C3A5]/30 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/50"
          />
        </div>
      </header>

      <main className="px-5 space-y-8 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center py-20 text-[#8E8D8A]">
            <Loader2 className="w-10 h-10 animate-spin mb-2" />
            <p>Đang lấy dữ liệu...</p>
          </div>
        ) : filteredCollections.map((col) => {
          const folderTheme = getThemeByDate(col.date_key || col.created_at);
          
          return (
            <section key={col.id} className="space-y-4">
              <h2 className="text-xl font-bold text-[#474747] ml-2">
                {col.title}
              </h2>

              <div
                onClick={() => navigate(`/collection/${col.id}`)}
                style={{ backgroundColor: folderTheme.bg }}
                className="relative rounded-[40px] p-8 shadow-sm transition-all active:scale-[0.98] cursor-pointer hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-xl">
                    <Copy
                      className="w-4 h-4"
                      style={{ color: folderTheme.main }}
                    />
                    <span className="text-lg font-bold text-[#555]">
                       {col.vocab_count || 0} từ vựng
                    </span>
                  </div>
                  <ChevronRight className="w-6 h-6 text-[#C7C7C7]" />
                </div>

                {/* HIỂN THỊ TỐI ĐA 4 ẢNH */}
                <div className="flex gap-3 overflow-hidden mb-4">
                  {col.images && col.images.slice(0, 3).map((img, idx) => (
                    <div key={idx} className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-sm shrink-0">
                      <img src={img} alt="vocab" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {col.vocab_count > 4 && (
                    <div className="w-16 h-16 rounded-2xl bg-white/50 backdrop-blur flex items-center justify-center text-xs font-bold text-[#8E8D8A]">
                      +{col.vocab_count - 4}
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                   <div className="text-xs text-[#8E8D8A] font-medium">
                     Ngày tạo: {new Date(col.date_key || col.created_at).toLocaleDateString('vi-VN')}
                   </div>
                </div>
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
};

export default CollectionPage;