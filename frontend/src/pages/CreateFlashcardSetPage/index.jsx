import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Plus,
  CheckCircle,
  BookOpen,
  Camera,
  Filter,
  X,
  ChevronRight,
  MinusCircle,
} from "lucide-react";
import { useFlashcardStore } from "../../store/flashcardStore";
import { axiosPrivate } from "../../apis/axios";

// --- Định nghĩa nhóm với icon ---
const GROUP_MAPPING = {
  "Gia đình & Quan hệ": { icon: "👨‍👩‍👧‍👦", topics: ["giadinh", "connguoi"] },
  "Cuộc sống & Nhà cửa": { icon: "🏠", topics: ["nhacua", "dovan", "dodung", "vesinh"] },
  "Ăn uống & Thực phẩm": { icon: "🍜", topics: ["doan", "thit", "rau", "luongthuc", "giavi"] },
  "Động vật & Thiên nhiên": { icon: "🐾", topics: ["dongvat", "thiennhien", "mua", "thoitiet"] },
  "Thời gian": { icon: "⏰", topics: ["thoigian"] },
  "Địa điểm & Phương hướng": { icon: "📍", topics: ["diadiem", "thanhpho", "vitri", "huong", "kientruc"] },
  "Giao thông & Du lịch": { icon: "🚗", topics: ["giaothong"] },
  "Hành động (Động từ)": { icon: "🏃", topics: ["dongtu"] },
  "Tính chất (Tính từ)": { icon: "🎨", topics: ["tinhtu", "tinhtu_i", "tinhtu_na", "trangthai"] },
  "Trường học & Công việc": { icon: "📚", topics: ["hoc_tap", "truonghoc", "giaoduc", "nghenghiep", "congty", "it"] },
  "Đại từ & Từ để hỏi": { icon: "❓", topics: ["daitu", "nghevan", "tunghevan", "tu_noi"] },
  "Màu sắc & Đồ vật & Khác": { icon: "🎨", topics: ["mausac", "quanao", "phukien", "dovat", "vatlieu", "khac", "sodem", "trangtu", "sothich", "giaitri", "extra"] },
};

const CreateFlashcardSetPage = () => {
  const navigate = useNavigate();
  const {
    createFlashcardSet,
    savedVocabularies,
    fetchSavedVocabularies,
    loading: cameraLoading,
  } = useFlashcardStore();

  const [formData, setFormData] = useState({ name: "", description: "" });
  const [selectedItems, setSelectedItems] = useState([]);
  const [activeTab, setActiveTab] = useState("camera");
  const [selectedTopic, setSelectedTopic] = useState(Object.keys(GROUP_MAPPING)[0]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [systemVocabs, setSystemVocabs] = useState([]);
  const [systemLoading, setSystemLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // --- Bảo vệ savedVocabularies (luôn là mảng) ---
  const safeSavedVocabularies = Array.isArray(savedVocabularies) ? savedVocabularies : [];

  const uniqueSavedVocabularies = useMemo(() => {
    const seen = new Map();
    for (const item of safeSavedVocabularies) {
      if (!seen.has(item.vocabulary)) {
        seen.set(item.vocabulary, item);
      }
    }
    return Array.from(seen.values());
  }, [safeSavedVocabularies]);

  useEffect(() => {
    fetchSavedVocabularies();
  }, [fetchSavedVocabularies]);

  useEffect(() => {
    const uniqueCameraIds = new Set(uniqueSavedVocabularies.map(v => v.id));
    setSelectedItems((prev) =>
      prev.filter(
        (item) => item.type !== "camera" || uniqueCameraIds.has(item.id)
      )
    );
  }, [uniqueSavedVocabularies]);

  // ============ SỬA Ở ĐÂY ============
  useEffect(() => {
    if (activeTab === "library" && selectedTopic) {
      const fetchSystemWords = async () => {
        setSystemLoading(true);
        setApiError(null);
        try {
          const topicData = GROUP_MAPPING[selectedTopic];
          const topicList = topicData?.topics || [];
          if (topicList.length === 0) {
            setSystemVocabs([]);
            return;
          }
          const requests = topicList.map((topic) =>
            axiosPrivate.get(`/api/vocabularies/?topic=${topic}`)
          );
          const responses = await Promise.all(requests);
          // Lấy results từ mỗi response (vì API trả về pagination)
          const allVocabs = responses.flatMap((res) => {
            if (res.data && Array.isArray(res.data.results)) {
              return res.data.results;
            } else if (Array.isArray(res.data)) {
              return res.data;
            }
            return [];
          });
          const unique = allVocabs.filter(
            (v, i, self) => self.findIndex((t) => t.id === v.id) === i
          );
          setSystemVocabs(unique);
        } catch (err) {
          console.error("Lỗi tải từ vựng:", err);
          if (err.response?.status === 401) {
            setApiError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            setTimeout(() => navigate("/login"), 2000);
          } else {
            setApiError("Không thể tải từ vựng. Vui lòng thử lại.");
          }
          setSystemVocabs([]);
        } finally {
          setSystemLoading(false);
        }
      };
      fetchSystemWords();
    }
  }, [activeTab, selectedTopic, navigate]);
  // =====================================

  const toggleSelect = (type, id) => {
    setSelectedItems((prev) => {
      const exists = prev.some((item) => item.type === type && item.id === id);
      return exists
        ? prev.filter((item) => !(item.type === type && item.id === id))
        : [...prev, { type, id }];
    });
  };

  const isSelected = (type, id) =>
    selectedItems.some((item) => item.type === type && item.id === id);

  const isAllTopicSelected =
    systemVocabs.length > 0 &&
    systemVocabs.every((v) => isSelected("system", v.id));

  const handleToggleAllFromTopic = () => {
    if (isAllTopicSelected) {
      const systemIdsInTopic = new Set(systemVocabs.map((v) => v.id));
      setSelectedItems((prev) =>
        prev.filter(
          (item) => !(item.type === "system" && systemIdsInTopic.has(item.id))
        )
      );
    } else {
      setSelectedItems((prev) => {
        const merged = [...prev];
        systemVocabs.forEach((v) => {
          if (!merged.some((item) => item.type === "system" && item.id === v.id)) {
            merged.push({ type: "system", id: v.id });
          }
        });
        return merged;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedItems.length < 5) return alert("Cần chọn ít nhất 5 từ.");
    if (!formData.name.trim()) return alert("Vui lòng nhập tên bộ.");
    setApiError(null);
    try {
      await createFlashcardSet({ ...formData, items: selectedItems });
      navigate("/flashcard");
    } catch (error) {
      console.error("Lỗi tạo bộ:", error);
      if (error.response?.status === 401) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        navigate("/login");
      } else {
        alert("Lỗi khi tạo bộ từ vựng.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#FEE9E7] pt-8 pb-4 px-5 rounded-b-[32px] shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#4A4A4A] shadow-sm active:scale-95 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-extrabold text-[#2D2D2D]">Tạo bộ từ mới</h1>
        </div>
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white">
          <input
            type="text"
            placeholder="Tên bộ từ vựng..."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-transparent border-none focus:ring-0 text-lg font-semibold placeholder:text-gray-400 p-0"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mt-6">
        <div className="bg-gray-100 p-1 rounded-2xl flex gap-1">
          <TabButton active={activeTab === "camera"} onClick={() => setActiveTab("camera")} icon={<Camera size={18} />} label="Từ camera" />
          <TabButton active={activeTab === "library"} onClick={() => setActiveTab("library")} icon={<BookOpen size={18} />} label="Thư viện" />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 mt-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Tiến độ chọn từ</p>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-black ${selectedItems.length >= 5 ? "text-green-500" : "text-[#E85A4F]"}`}>{selectedItems.length}</span>
                <span className="text-gray-300 font-bold">/</span>
                <span className="text-gray-400 font-bold text-sm">Tối thiểu 5</span>
              </div>
            </div>
            {activeTab === "library" && systemVocabs.length > 0 && (
              <button onClick={handleToggleAllFromTopic} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${isAllTopicSelected ? "bg-gray-200 text-gray-600" : "bg-[#FEE9E7] text-[#E85A4F]"}`}>
                {isAllTopicSelected ? <MinusCircle size={14} /> : <Plus size={14} />}
                {isAllTopicSelected ? "Bỏ chọn tất cả" : `Chọn tất cả ${systemVocabs.length} từ`}
              </button>
            )}
          </div>

          {activeTab === "library" && (
            <button onClick={() => setIsSheetOpen(true)} className="flex items-center justify-between w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm active:scale-[0.98] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FEE9E7] rounded-xl flex items-center justify-center text-[#E85A4F]"><Filter size={20} /></div>
                <div className="text-left">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[1px]">Chủ đề</p>
                  <p className="text-[#2D2D2D] font-bold">
                    {GROUP_MAPPING[selectedTopic]?.icon || "📂"} {selectedTopic}
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </button>
          )}

          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm font-medium flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <span>{apiError}</span>
            </div>
          )}
        </div>

        {/* List Vocabulary */}
        <div className="space-y-3">
          {activeTab === "camera" ? (
            cameraLoading ? (
              <LoadingSkeleton />
            ) : uniqueSavedVocabularies.length === 0 ? (
              <EmptyState msg="Bạn chưa lưu từ nào từ camera." />
            ) : (
              uniqueSavedVocabularies.map((v) => (
                <VocabularyCard
                  key={`camera-${v.id}`}
                  word={v.word}
                  meaning={v.meaning}
                  image={v.user_image}
                  selected={isSelected("camera", v.id)}
                  onToggle={() => toggleSelect("camera", v.id)}
                />
              ))
            )
          ) : systemLoading ? (
            <LoadingSkeleton />
          ) : systemVocabs.length === 0 ? (
            <EmptyState msg="Không có từ vựng nào trong chủ đề này." />
          ) : (
            systemVocabs.map((v) => (
              <VocabularyCard
                key={`system-${v.id}`}
                word={v.word}
                meaning={v.meaning}
                image={v.image_url}
                selected={isSelected("system", v.id)}
                onToggle={() => toggleSelect("system", v.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Bottom Sheet */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsSheetOpen(false)} />
          <div className="relative w-full max-h-[75vh] bg-white rounded-t-[40px] shadow-2xl flex flex-col animate-slide-up overflow-hidden">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-1" />
            <div className="p-6 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-black text-[#2D2D2D]">Chọn chủ đề</h3>
              <button onClick={() => setIsSheetOpen(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2 pb-10">
              {Object.keys(GROUP_MAPPING).map((group) => (
                <button key={group} onClick={() => { setSelectedTopic(group); setIsSheetOpen(false); }} className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all ${selectedTopic === group ? "bg-[#FEE9E7] border border-[#E85A4F]/20 shadow-sm" : "bg-[#FAFAFA] active:bg-gray-100"}`}>
                  <span className="text-2xl">{GROUP_MAPPING[group]?.icon || "📂"}</span>
                  <span className={`flex-1 text-left font-bold ${selectedTopic === group ? "text-[#E85A4F]" : "text-[#4A4A4A]"}`}>{group}</span>
                  {selectedTopic === group && <CheckCircle size={20} className="text-[#E85A4F]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none">
        <button onClick={handleSubmit} disabled={selectedItems.length < 5 || !formData.name.trim()} className="pointer-events-auto w-full py-4 bg-[#E85A4F] text-white rounded-2xl font-extrabold text-lg shadow-[0_8px_25px_-5px_rgba(232,90,79,0.5)] active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2">
          <Plus size={24} /> Tạo bộ flashcard
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } } .animate-slide-up { animation: slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1); }` }} />
    </div>
  );
};

// --- Sub-components ---
const TabButton = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${active ? "bg-white text-[#E85A4F] shadow-sm" : "text-gray-500"}`}>
    {icon} {label}
  </button>
);

const VocabularyCard = ({ word, meaning, image, selected, onToggle }) => (
  <div onClick={onToggle} className={`flex items-center gap-4 p-3 rounded-[20px] transition-all duration-300 border ${selected ? "bg-white border-[#E85A4F] shadow-md scale-[1.01]" : "bg-white border-transparent shadow-sm"}`}>
    <div className="w-16 h-16 rounded-2xl bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100">
      {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50"><BookOpen size={20} /></div>}
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-bold text-[#2D2D2D] text-base truncate">{word || "???"}</div>
      <div className="text-gray-400 text-xs font-medium truncate mt-0.5">{meaning || "???"}</div>
    </div>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${selected ? "bg-[#E85A4F] text-white shadow-lg" : "bg-gray-100 text-gray-300"}`}>
      {selected ? <CheckCircle size={18} fill="currentColor" /> : <Plus size={18} />}
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-3">
    {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
  </div>
);

const EmptyState = ({ msg }) => (
  <div className="text-center py-12 bg-white rounded-[32px] border-2 border-dashed border-gray-100">
    <div className="text-4xl mb-2">📸</div>
    <p className="text-gray-400 text-sm font-medium px-10 leading-relaxed">{msg}</p>
  </div>
);

export default CreateFlashcardSetPage;