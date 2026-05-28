// src/components/WordDetailModal.jsx
import React, { useState, useRef, useEffect } from "react";
import { X, Star, Trash2, BookOpen, Volume2, Plus, Loader2 } from "lucide-react";
import { useFlashcardStore } from "../../store/flashcardStore";

const WordDetailModal = ({
  item,
  onClose,
  onToggleMemorized,
  onDelete,
  relatedWords = [],
  hideRelated = false,
  isSystem = false,
  onAddToFlashcard,
}) => {
  // ========== TẤT CẢ HOOKS ĐƯỢC ĐẶT Ở ĐÂY, TRƯỚC MỌI ĐIỀU KIỆN RETURN ==========
  const [showRelatedSection, setShowRelatedSection] = useState(false);
  const [dynamicHint, setDynamicHint] = useState("");
  const resetTimeoutRef = useRef(null);
  const [showFlashcardList, setShowFlashcardList] = useState(false);
  const [addingToSet, setAddingToSet] = useState(false);
  const { flashcardSets, fetchFlashcardSets, addVocabularyToSet, loading } = useFlashcardStore();

  // useEffect cleanup – phải được gọi TRƯỚC return sớm
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  // ========== KIỂM TRA ITEM NULL SAU KHI ĐÃ GỌI HẾT HOOKS ==========
  if (!item) return null;

  // ========== CÁC HÀM XỬ LÝ (KHÔNG PHẢI HOOK) ==========
  const showTemporaryHint = (text) => {
    setDynamicHint(text);
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(() => {
      setDynamicHint("");
    }, 3000);
  };

  const defaultRelatedWords = [
    { id: 101, emoji: "🪑", kanji: "机", furigana: "つくえ", meaning: "Cái bàn" },
    { id: 102, emoji: "📚", kanji: "本", furigana: "ほん", meaning: "Quyển sách" },
    { id: 103, emoji: "✏️", kanji: "鉛筆", furigana: "えんぴつ", meaning: "Bút chì" },
    { id: 104, emoji: "🧽", kanji: "消しゴム", furigana: "けしごむ", meaning: "Cục tẩy" },
  ];

  const wordsToShow = relatedWords.length > 0 ? relatedWords : defaultRelatedWords;

  const handlePlayAudio = () => {
    const audioUrl = item.audio_url;
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch((err) => {
        console.error("Không thể phát âm thanh:", err);
        showTemporaryHint("Không thể phát âm thanh, hãy thử lại sau.");
      });
    } else {
      showTemporaryHint("Chưa có file âm thanh cho từ này.");
    }
  };

  const handleOpenFlashcardList = async () => {
    setShowFlashcardList(true);
    if (flashcardSets.length === 0) {
      await fetchFlashcardSets();
    }
  };

  const handleAddToSet = async (setId, setName) => {
    setAddingToSet(true);
    try {
      await addVocabularyToSet(setId, { type: "system", id: item.id });
      setDynamicHint(`✅ Đã thêm "${item.ja}" vào bộ "${setName}"!`);
      setTimeout(() => setDynamicHint(""), 3000);
      setShowFlashcardList(false);
    } catch (err) {
      let errorMessage = "";
      const data = err.response?.data;
      if (data?.non_field_errors?.[0]) errorMessage = data.non_field_errors[0];
      else errorMessage = err.message || "Lỗi không xác định";

      if (errorMessage.includes("đã có trong bộ")) {
        setDynamicHint(`⚠️ "${item.ja}" đã có trong bộ "${setName}"!`);
      } else {
        setDynamicHint(`❌ ${errorMessage}`);
      }
      setTimeout(() => setDynamicHint(""), 3000);
      setShowFlashcardList(false);
    } finally {
      setAddingToSet(false);
    }
  };

  // ========== RENDER JSX ==========
  return (
    <>
      {/* Modal chính */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl max-w-md w-full p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

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

          <div className="mt-4 text-center">
            <h2 className="text-4xl font-bold text-[#2D2D2D]">{item.ja}</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <p className="text-xl text-[#E85A4F] font-medium">{item.reading}</p>
              <button
                onClick={handlePlayAudio}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Nghe phát âm"
              >
                <Volume2 className="w-5 h-5 text-[#E85A4F]" />
              </button>
            </div>
            <p className="text-2xl font-semibold text-[#4A4A4A] mt-3">
              {item.vi}
            </p>
          </div>

          <div className="mt-6 bg-[#F9F9F9] p-4 rounded-2xl">
            <p className="text-sm font-semibold text-[#8E8D8A] mb-1">Ví dụ</p>
            <p className="text-base text-[#333]">{item.example}</p>
            {item.exampleTranslation && (
              <p className="text-sm text-gray-500 italic mt-1">
                {item.exampleTranslation}
              </p>
            )}
          </div>

          {!hideRelated && (
            <>
              <div className="mt-4">
                <button
                  onClick={() => setShowRelatedSection(!showRelatedSection)}
                  className="w-full py-3 border border-gray-200 text-[#4A4A4A] rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <span>📚</span>
                  {showRelatedSection ? "Ẩn từ liên quan" : "Xem từ liên quan"}
                </button>
              </div>

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
            </>
          )}

          <div className="mt-6">
            {isSystem ? (
              <button
                onClick={handleOpenFlashcardList}
                className="w-full py-3 bg-[#E85A4F] text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#d94b3f] transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                Thêm vào Flashcard
              </button>
            ) : (
              <button
                onClick={() => {
                  // Loại bỏ window.confirm, gọi onDelete trực tiếp
                  onDelete(item.id);
                  onClose();
                }}
                className="w-full py-3 border border-gray-300 text-gray-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Xóa từ
              </button>
            )}
          </div>

          {dynamicHint && (
            <p className="mt-4 text-xs text-center text-[#E85A4F] bg-[#FEE9E7] py-2 px-3 rounded-full transition-all duration-300 font-medium">
              {dynamicHint}
            </p>
          )}
        </div>
      </div>

      {/* Modal con: danh sách bộ flashcard */}
      {showFlashcardList && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowFlashcardList(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#2D2D2D]">Chọn bộ flashcard</h3>
              <button onClick={() => setShowFlashcardList(false)} className="p-1">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 text-[#E85A4F] animate-spin" />
              </div>
            ) : flashcardSets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Chưa có bộ flashcard nào.</p>
                <button
                  onClick={() => setShowFlashcardList(false)}
                  className="mt-3 text-[#E85A4F] font-semibold"
                >
                  Tạo bộ mới
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {flashcardSets.map((set) => (
                  <button
                    key={set.id}
                    onClick={() => handleAddToSet(set.id, set.name)}
                    disabled={addingToSet}
                    className="w-full text-left p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold text-gray-800">{set.name}</div>
                      <div className="text-xs text-gray-400">
                        {set.item_count || 0} từ
                      </div>
                    </div>
                    {addingToSet ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#E85A4F]" />
                    ) : (
                      <Plus className="w-5 h-5 text-[#E85A4F]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default WordDetailModal;