import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, CheckCircle } from "lucide-react";
import { useFlashcardStore } from "../../store/flashcardStore";

const CreateFlashcardSetPage = () => {
  const navigate = useNavigate();
  const {
    createFlashcardSet,
    savedVocabularies,
    fetchSavedVocabularies,
    loading,
  } = useFlashcardStore();

  const [formData, setFormData] = useState({
    name: "Mặc định 2",
    description: "",
    saved_vocab_ids: [],
  });

  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    fetchSavedVocabularies();
  }, [fetchSavedVocabularies]);

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setFormData((prev) => ({
      ...prev,
      saved_vocab_ids: Array.from(newSelected),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.saved_vocab_ids.length < 5) {
      alert("Cần chọn ít nhất 5 từ để tạo bộ.");
      return;
    }
    if (!formData.name.trim()) {
      alert("Vui lòng nhập tên bộ.");
      return;
    }
    try {
      await createFlashcardSet(formData);
      navigate("/flashcard");
    } catch (error) {
      alert("Có lỗi xảy ra: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      {/* Header */}
      <div className="bg-[#FEE9E7] px-6 pt-10 pb-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#4A4A4A] shadow-md"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Tạo bộ từ mới</h1>
        </div>

        {/* Tên bộ từ vựng */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-[#4A4A4A] mb-1">
            Tên bộ từ vựng
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-0 py-2 border-b border-gray-200 focus:outline-none focus:border-[#E85A4F] text-lg"
            required
          />
        </div>
      </div>

      {/* Phần chọn từ vựng */}
      <div className="px-6 mt-4">
        {/* Thông báo số lượng */}
        <div className="mb-4 text-[#E85A4F] font-medium">
          Cần ít nhất 5 từ ({selectedIds.size} đã chọn)
        </div>

        {/* Danh sách từ vựng */}
        {loading ? (
          <div className="text-center py-8">Đang tải từ vựng...</div>
        ) : savedVocabularies.length === 0 ? (
          <div className="text-center py-8 text-[#8E8D8A]">
            Bạn chưa có từ vựng nào. Hãy chụp ảnh và lưu từ trước!
          </div>
        ) : (
          <div className="space-y-4">
            {savedVocabularies.map((vocab) => {
              const isSelected = selectedIds.has(vocab.id);
              const vocabDetail = vocab.vocabulary_details || {};
              const displayImage = vocab.user_image || vocabDetail.image_url;

              return (
                <div
                  key={vocab.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Ảnh minh họa */}
                  <div className="w-16 h-16 rounded-xl bg-[#F9F9F9] flex-shrink-0 overflow-hidden">
                    {displayImage ? (
                      <img
                        src={displayImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl text-gray-400">
                        📷
                      </div>
                    )}
                  </div>

                  {/* Thông tin từ */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl font-bold text-[#2D2D2D]">
                        {vocabDetail.word || "???"}
                      </span>
                    </div>
                    <p className="text-base text-[#4A4A4A] truncate">
                      {vocabDetail.meaning || "???"}
                    </p>
                  </div>

                  {/* Nút +/- */}
                  <button
                    onClick={() => toggleSelect(vocab.id)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-[#E85A4F] text-white"
                        : "bg-gray-100 text-[#4A4A4A] hover:bg-gray-200"
                    }`}
                  >
                    {isSelected ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Plus className="w-6 h-6" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Nút tạo bộ - Fixed bottom */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <button
            onClick={handleSubmit}
            disabled={loading || selectedIds.size < 5 || !formData.name.trim()}
            className="w-full py-4 bg-[#E85A4F] text-white rounded-xl font-bold text-lg shadow-lg hover:bg-[#d14b41] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Tạo bộ từ vựng
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateFlashcardSetPage;
