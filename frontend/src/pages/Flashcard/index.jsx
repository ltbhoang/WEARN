import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Plus,
  BookOpen,
  ChevronRight,
  Star,
  Layers,
  Clock,
  Search,
} from "lucide-react";

import { useFlashcardStore } from "../../store/flashcardStore";

const FlashcardSetsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { flashcardSets, fetchFlashcardSets, loading } = useFlashcardStore();

  useEffect(() => {
    fetchFlashcardSets();
  }, [fetchFlashcardSets]);

  const filteredSets = flashcardSets.filter(
    (set) =>
      set.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      set.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#E85A4F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8E8D8A]">Đang tải bộ flashcard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans pb-28">
      {/* Header */}
      <div className="bg-[#FEE9E7] px-6 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#4A4A4A] shadow-md"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-[#2D2D2D]">
              Bộ từ vựng của bạn
            </h1>
          </div>

          <button
            onClick={() => navigate("/flashcard/create")}
            className="w-12 h-12 rounded-full bg-[#E85A4F] flex items-center justify-center text-white shadow-lg hover:bg-[#d14b41] transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="relative mt-2">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#8E8D8A]" />
          <input
            type="text"
            placeholder="Tìm kiếm bộ flashcard..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E85A4F] focus:border-transparent"
          />
        </div>

        {/* Thống kê nhanh */}
        <div className="flex items-center justify-between mt-4 bg-white/50 backdrop-blur-sm rounded-xl p-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#E85A4F]" />
            <span className="text-sm text-[#4A4A4A]">
              {flashcardSets.length} bộ
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="text-sm text-[#4A4A4A]">
              {flashcardSets.reduce(
                (total, set) => total + (set.memorized_count || 0),
                0
              )}{" "}
              từ đã nhớ
            </span>
          </div>
        </div>
      </div>

      {/* Danh sách bộ flashcard */}
      <div className="px-6 mt-6 space-y-4">
        {filteredSets.length > 0 ? (
          filteredSets.map((set) => (
            <div
              key={set.id}
              onClick={() => {
                // Debug: xem cấu trúc items
                console.log("Bộ flashcard:", set);
                navigate(`/flashcard/${set.id}`);
              }}
              className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow border border-gray-100 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#2D2D2D] mb-1">
                    {set.name}
                  </h3>
                  {set.description && (
                    <p className="text-sm text-[#8E8D8A] line-clamp-2 mb-2">
                      {set.description}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-[#8E8D8A] flex-shrink-0" />
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#8E8D8A]">Hoàn thành</span>
                  <span className="font-medium text-[#E85A4F]">
                    {Math.round(
                      ((set.memorized_count || 0) / (set.item_count || 1)) * 100
                    )}
                    %
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#E85A4F] rounded-full"
                    style={{
                      width: `${
                        ((set.memorized_count || 0) / (set.item_count || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Thông tin chi tiết */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1 text-[#8E8D8A]">
                  <BookOpen className="w-4 h-4" />
                  <span>{set.item_count || 0} từ</span>
                </div>
                <div className="flex items-center gap-1 text-[#8E8D8A]">
                  <Star className="w-4 h-4" />
                  <span>{set.memorized_count || 0} đã học</span>
                </div>
                <div className="flex items-center gap-1 text-[#8E8D8A]">
                  <Clock className="w-4 h-4" />
                  <span>Tạo: {formatDate(set.created_at)}</span>
                </div>
              </div>

              {/* Badge mặc định */}
              {set.name.toLowerCase().includes("mặc định") && (
                <div className="mt-2 inline-block px-2 py-1 bg-[#FEE9E7] text-[#E85A4F] text-xs rounded-full">
                  Mặc định
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-[#FEE9E7] rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-12 h-12 text-[#E85A4F]" />
            </div>
            <h3 className="text-lg font-bold text-[#2D2D2D] mb-2">
              Chưa có bộ flashcard nào
            </h3>
            <p className="text-sm text-[#8E8D8A] mb-6">
              Bắt đầu tạo bộ flashcard đầu tiên để học từ vựng hiệu quả hơn!
            </p>
            <button
              onClick={() => navigate("/flashcard/create")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#E85A4F] text-white rounded-xl font-semibold shadow-lg hover:bg-[#d14b41] transition-colors"
            >
              <Plus className="w-5 h-5" />
              Tạo bộ flashcard
            </button>
          </div>
        )}
      </div>

      {/* Nút float cho mobile */}
      {filteredSets.length > 0 && (
        <button
          onClick={() => navigate("/flashcard/create")}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#E85A4F] flex items-center justify-center text-white shadow-lg hover:bg-[#d14b41] transition-colors lg:hidden"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default FlashcardSetsPage;