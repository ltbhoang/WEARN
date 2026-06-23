// src/pages/vocabulary/GroupDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useVocabStore } from "../../store/vocabStore";
import { axiosPrivate } from "../../apis/axios";
import WordDetailModal from "../../components/WordDetail";

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
  const [fetchingDetail, setFetchingDetail] = useState(false);

  const formatWordItem = (word) => ({
    id: word.id || word.class_name,
    class_name: word.class_name, // 👈 giữ class_name để gọi chi tiết
    ja: word.word,
    reading: word.reading_hiragana,
    vi: word.meaning,
    example: word.example_sentence || "",
    exampleTranslation: word.example_translation || "",
    img: word.image_url || "",
    memorized: word.is_memorized || false,
    audio_url: word.audio_url || word.audio,
    topicId: word.topic,
  });

  useEffect(() => {
    if (!topicIds.length) {
      setLoading(false);
      return;
    }

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const response = await axiosPrivate.get(
          "/api/vocabularies/all-by-topic/"
        );
        const allData = response.data;
        const newWordsByTopic = {};
        topicIds.forEach((topicId) => {
          const words = allData[topicId];
          if (words && words.length) {
            newWordsByTopic[topicId] = words.map(formatWordItem);
          }
        });
        setWordsByTopic(newWordsByTopic);
      } catch (err) {
        console.error("Lỗi fetch gộp:", err);
        setWordsByTopic({});
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [topicIds]);

  const handleToggleMemorized = async (wordId) => {
    setActionLoading(true);
    try {
      await axiosPrivate.patch(`/api/vocabularies/${wordId}/memorized/`);
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

  const handleDeleteWord = async (wordId) => {
    if (!window.confirm("Bạn có chắc muốn xóa từ này khỏi nhóm?")) return;
    setActionLoading(true);
    try {
      await axiosPrivate.delete(`/api/vocabularies/${wordId}/`);
      setWordsByTopic((prev) => {
        const newState = { ...prev };
        for (const topicId in newState) {
          newState[topicId] = newState[topicId].filter(
            (word) => word.id !== wordId
          );
        }
        Object.keys(newState).forEach((topicId) => {
          if (newState[topicId].length === 0) delete newState[topicId];
        });
        return newState;
      });
      setSelectedWord(null);
    } catch (err) {
      console.error("Lỗi xóa từ:", err);
      alert("Không thể xóa từ vựng");
    } finally {
      setActionLoading(false);
    }
  };

  // ========== HÀM XỬ LÝ CLICK: FETCH CHI TIẾT ==========
  const handleWordClick = async (word) => {
    // Nếu đã có đầy đủ example (tức là đã fetch trước đó) thì hiển thị luôn
    if (word.example && word.exampleTranslation) {
      setSelectedWord(word);
      return;
    }
    setFetchingDetail(true);
    try {
      // Gọi API chi tiết theo class_name
      const response = await axiosPrivate.get(`/api/vocabularies/${word.class_name}/`);
      const detail = response.data;
      // Gộp dữ liệu chi tiết vào word
      const fullWord = {
        ...word,
        example: detail.example_sentence || word.example || "",
        exampleTranslation: detail.example_translation || word.exampleTranslation || "",
        audio_url: detail.audio_url || word.audio_url,
      };
      setSelectedWord(fullWord);
    } catch (err) {
      console.error("Lỗi fetch chi tiết từ vựng:", err);
      // Fallback: hiển thị với dữ liệu hiện có
      setSelectedWord(word);
    } finally {
      setFetchingDetail(false);
    }
  };

  const closeModal = () => {
    setSelectedWord(null);
    resetCurrentVocabulary();
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
          onDelete={handleDeleteWord}
          relatedWords={[]}
          hideRelated={true}
          isSystem={true}
          onAddToFlashcard={(word) => {
            console.log("Thêm vào flashcard:", word);
            alert(`Đã thêm "${word.ja}" vào flashcard!`);
          }}
        />
      )}
      {(actionLoading || fetchingDetail) && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}
    </div>
  );
};

export default GroupDetailPage;