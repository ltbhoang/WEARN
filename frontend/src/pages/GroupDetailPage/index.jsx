// src/pages/vocabulary/GroupDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useVocabStore } from "../../store/vocabStore";
import { axiosPrivate } from "../../apis/axios";
import WordDetailModal from "../../components/WordDetail";

// Đồng bộ GROUP_MAPPING với TopicListPage (12 nhóm)
const GROUP_MAPPING = {
  "Gia đình & Quan hệ": ["giadinh", "connguoi"],
  "Cuộc sống & Nhà cửa": ["nhacua", "dovan", "dodung", "vesinh"],
  "Ăn uống & Thực phẩm": ["doan", "thit", "rau", "luongthuc", "giavi"],
  "Động vật & Thiên nhiên": ["dongvat", "thiennhien", "mua", "thoitiet"],
  "Thời gian": ["thoigian"],
  "Địa điểm & Phương hướng": [
    "diadiem",
    "thanhpho",
    "vitri",
    "huong",
    "kientruc",
  ],
  "Giao thông & Du lịch": ["giaothong"],
  "Hành động (Động từ)": ["dongtu"],
  "Tính chất (Tính từ)": ["tinhtu", "tinhtu_i", "tinhtu_na", "trangthai"],
  "Trường học & Công việc": [
    "hoc_tap",
    "truonghoc",
    "giaoduc",
    "nghenghiep",
    "congty",
    "it",
  ],
  "Đại từ & Từ để hỏi": ["daitu", "nghevan", "tunghevan", "tu_noi"],
  "Màu sắc & Đồ vật & Khác": [
    "mausac",
    "quanao",
    "phukien",
    "dovat",
    "vatlieu",
    "khac",
    "sodem",
    "trangtu",
    "sothich",
    "giaitri",
    "extra",
  ],
};

const GroupDetailPage = () => {
  const { groupName } = useParams();
  const navigate = useNavigate();
  const decodedGroupName = decodeURIComponent(groupName);
  const topicIds = GROUP_MAPPING[decodedGroupName] || [];

  const { error, resetCurrentVocabulary } = useVocabStore();
  const [wordsByTopic, setWordsByTopic] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Helper: chuyển dữ liệu từ API sang format WordDetailModal
  const formatWordItem = (word) => ({
    id: word.id || word.class_name,
    ja: word.word,
    reading: word.romaji || word.pronunciation,
    vi: word.meaning,
    example: word.example_sentence || "",
    exampleTranslation: word.example_translation || "",
    img: word.image_url || "",
    memorized: word.is_memorized || false,
    audio_url: word.audio_url || word.audio,
    topicId: word.topic,
  });

  // Hàm fetch trực tiếp từ API cho một topic
  const fetchWordsForTopic = async (topicId) => {
    try {
      const response = await axiosPrivate.get(
        `/api/vocabularies/?topic=${topicId}`
      );
      // Chuyển đổi dữ liệu ngay khi nhận
      const formattedWords = response.data.map(formatWordItem);
      return { topicId, words: formattedWords };
    } catch (err) {
      console.error(`Lỗi fetch topic ${topicId}:`, err);
      return { topicId, words: [] };
    }
  };

  useEffect(() => {
    if (!topicIds.length) {
      setLoading(false);
      return;
    }

    const fetchAllTopics = async () => {
      setLoading(true);
      const results = await Promise.all(
        topicIds.map((id) => fetchWordsForTopic(id))
      );
      const newWordsByTopic = {};
      results.forEach(({ topicId, words }) => {
        if (words && words.length > 0) {
          newWordsByTopic[topicId] = words;
        }
      });
      setWordsByTopic(newWordsByTopic);
      setLoading(false);
    };

    fetchAllTopics();
  }, [topicIds]);

  // Cập nhật trạng thái memorized cho từ
  const handleToggleMemorized = async (wordId) => {
    setActionLoading(true);
    try {
      // Gọi API cập nhật memorized
      await axiosPrivate.patch(`/api/vocabularies/${wordId}/memorized/`);

      // Cập nhật local state (optimistic)
      setWordsByTopic((prev) => {
        const newState = { ...prev };
        for (const topicId in newState) {
          newState[topicId] = newState[topicId].map((word) =>
            word.id === wordId ? { ...word, memorized: !word.memorized } : word
          );
        }
        return newState;
      });
    } catch (err) {
      console.error("Lỗi cập nhật memorized:", err);
      alert("Không thể cập nhật trạng thái từ vựng");
    } finally {
      setActionLoading(false);
    }
  };

  // Xóa từ vựng
  const handleDeleteWord = async (wordId) => {
    if (!window.confirm("Bạn có chắc muốn xóa từ này khỏi nhóm?")) return;

    setActionLoading(true);
    try {
      await axiosPrivate.delete(`/api/vocabularies/${wordId}/`);

      // Xóa khỏi local state
      setWordsByTopic((prev) => {
        const newState = { ...prev };
        for (const topicId in newState) {
          newState[topicId] = newState[topicId].filter(
            (word) => word.id !== wordId
          );
        }
        // Xóa topic nếu không còn từ nào
        Object.keys(newState).forEach((topicId) => {
          if (newState[topicId].length === 0) delete newState[topicId];
        });
        return newState;
      });

      // Đóng modal nếu đang mở
      setSelectedWord(null);
    } catch (err) {
      console.error("Lỗi xóa từ:", err);
      alert("Không thể xóa từ vựng");
    } finally {
      setActionLoading(false);
    }
  };

  const handleWordClick = (word) => {
    setSelectedWord(word);
  };

  const closeModal = () => {
    setSelectedWord(null);
    resetCurrentVocabulary(); // Giữ lại để clear store nếu cần
  };

  if (error && !selectedWord) {
    return (
      <div className="min-h-screen bg-[#FAF9F8] flex items-center justify-center p-4">
        <div className="bg-red-50 p-6 rounded-2xl text-center">
          <p className="text-red-600 font-bold">Đã xảy ra lỗi</p>
          <p className="text-red-400 text-sm mt-1">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded-xl"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#E85A4F] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F8] pb-20">
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-[#E85A4F] hover:bg-gray-100 p-2 rounded-full transition"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-[#474747]">
            {decodedGroupName}
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {topicIds.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            Nhóm chủ đề không hợp lệ.
          </div>
        ) : (
          topicIds.map((topicId) => {
            const words = wordsByTopic[topicId] || [];
            if (words.length === 0) return null;

            return (
              <section key={topicId} className="mb-8">
                <h2 className="text-xl font-bold text-[#E85A4F] mb-3 border-l-4 border-[#E85A4F] pl-3">
                  {topicId}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {words.map((word) => (
                    <div
                      key={word.id}
                      onClick={() => handleWordClick(word)}
                      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] flex gap-3"
                    >
                      {/* Ảnh từ vựng */}
                      <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                        {word.img ? (
                          <img
                            src={word.img}
                            alt={word.ja}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.target.src = "https://picsum.photos/64/64";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            📷
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-lg text-[#474747]">
                          {word.ja}
                        </div>
                        <div className="text-sm text-gray-500">
                          {word.reading}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {word.vi}
                        </div>
                        {word.memorized && (
                          <div className="mt-1 inline-block bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">
                            Đã nhớ
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}

        {Object.keys(wordsByTopic).length === 0 &&
          !loading &&
          topicIds.length > 0 && (
            <div className="text-center text-gray-500 py-10">
              Không có từ vựng nào trong nhóm này.
            </div>
          )}
      </main>

      {selectedWord && (
        <WordDetailModal
          item={selectedWord}
          onClose={closeModal}
          onToggleMemorized={handleToggleMemorized}
          onDelete={handleDeleteWord} // vẫn truyền nhưng modal sẽ không dùng đến
          relatedWords={[]}
          hideRelated={true}
          isSystem={true}
          onAddToFlashcard={(word) => {
            // TODO: Gọi API thêm từ này vào flashcard của user
            console.log("Thêm vào flashcard:", word);
            alert(`Đã thêm "${word.ja}" vào flashcard!`);
          }}
        />
      )}

      {/* Overlay loading khi thao tác xóa/toggle */}
      {actionLoading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}
    </div>
  );
};

export default GroupDetailPage;
