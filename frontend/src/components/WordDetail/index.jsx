import React, { useState } from "react";
import { X, Star, Trash2 } from "lucide-react";

const WordDetailModal = ({
  item,
  onClose,
  onToggleMemorized,
  onDelete,
  relatedWords = [],
}) => {
  const [showRelatedSection, setShowRelatedSection] = useState(false);

  if (!item) return null;

  // Dữ liệu mẫu cho relatedWords nếu không được truyền vào
  const defaultRelatedWords = [
    { id: 101, emoji: "🪑", kanji: "机", furigana: "つくえ", meaning: "Cái bàn" },
    { id: 102, emoji: "📚", kanji: "本", furigana: "ほん", meaning: "Quyển sách" },
    { id: 103, emoji: "✏️", kanji: "鉛筆", furigana: "えんぴつ", meaning: "Bút chì" },
    { id: 104, emoji: "🧽", kanji: "消しゴム", furigana: "けしごむ", meaning: "Cục tẩy" },
  ];

  const wordsToShow = relatedWords.length > 0 ? relatedWords : defaultRelatedWords;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút sao toggle góc trái */}
        <button
          onClick={() => onToggleMemorized(item.id)}
          className="absolute top-4 left-4 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          aria-label={item.memorized ? "Bỏ đã nhớ" : "Đánh dấu đã nhớ"}
        >
          <Star
            className={`w-6 h-6 ${
              item.memorized
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-400"
            }`}
          />
        </button>

        {/* Nút đóng góc phải */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hình ảnh minh họa */}
        {item.img && (
          <div className="mt-2 flex justify-center">
            <div className="w-32 h-32 rounded-2xl overflow-hidden bg-[#F9F9F9] shadow-md">
              <img
                src={item.img}
                alt={item.ja}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}

        {/* Từ vựng và cách đọc */}
        <div className="mt-4 text-center">
          <h2 className="text-4xl font-bold text-[#2D2D2D]">{item.ja}</h2>
          <p className="text-xl text-[#E85A4F] font-medium mt-1">
            {item.reading}
          </p>
          <p className="text-2xl font-semibold text-[#4A4A4A] mt-3">
            {item.vi}
          </p>
        </div>

        {/* Ví dụ + bản dịch */}
        <div className="mt-6 bg-[#F9F9F9] p-4 rounded-2xl">
          <p className="text-sm font-semibold text-[#8E8D8A] mb-1">Ví dụ</p>
          <p className="text-base text-[#333]">{item.example}</p>
          {item.exampleTranslation && (
            <p className="text-sm text-gray-500 italic mt-1">
              {item.exampleTranslation}
            </p>
          )}
        </div>

        {/* Nút bật/tắt từ vựng liên quan */}
        <div className="mt-4">
          <button
            onClick={() => setShowRelatedSection(!showRelatedSection)}
            className="w-full py-3 border border-gray-200 text-[#4A4A4A] rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <span>📚</span>
            {showRelatedSection ? "Ẩn từ liên quan" : "Xem từ liên quan"}
          </button>
        </div>

        {/* Từ vựng liên quan (hiện tất cả nếu showRelatedSection = true) */}
        {showRelatedSection && (
          <div className="mt-4">
            <h3 className="text-lg font-bold text-[#2D2D2D] mb-3">
              Từ vựng liên quan
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {wordsToShow.map((word) => (
                <div
                  key={word.id}
                  className="bg-[#FAF9F8] p-3 rounded-xl border border-gray-100"
                >
                  <div className="text-2xl mb-1">{word.emoji}</div>
                  <div className="font-bold text-[#333]">{word.kanji}</div>
                  <div className="text-xs text-[#E85A4F] font-medium">
                    {word.furigana}
                  </div>
                  <div className="text-xs text-[#8E8D8A] mt-1 line-clamp-1">
                    {word.meaning}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nút xóa */}
        <div className="mt-6">
          <button
            onClick={() => {
              if (window.confirm("Bạn có chắc muốn xóa từ này khỏi danh sách?")) {
                onDelete(item.id);
                onClose();
              }
            }}
            className="w-full py-3 border border-gray-300 text-gray-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Xóa từ
          </button>
        </div>
      </div>
    </div>
  );
};

export default WordDetailModal;