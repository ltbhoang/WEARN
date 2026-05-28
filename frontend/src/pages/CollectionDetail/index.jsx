import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDataStore } from "../../store/dataStore";
import {
  ChevronLeft,
  BookOpen,
  Star,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import WordDetailModal from "../../components/WordDetail";
import { axiosPrivate } from "../../apis/axios";

const WEEKLY_PALETTE = [
  { main: "#E85A4F", bg: "#FEE9E7" },
  { main: "#E98074", bg: "#FEF0ED" },
  { main: "#D4A373", bg: "#FEF5E9" },
  { main: "#A7C4A0", bg: "#F3F9F1" },
  { main: "#7C9EB2", bg: "#F0F5F9" },
  { main: "#B185A7", bg: "#F9F2F7" },
  { main: "#D98C8C", bg: "#FEF2F2" },
];

const CollectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchCollectionDetail, getVocabulariesByCollection, loadingStates } =
    useDataStore();

  const [collectionInfo, setCollectionInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);

  const isLoading = loadingStates.detail?.[id] || false;
  const vocabularies = getVocabulariesByCollection(id) || [];

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  useEffect(() => {
    const loadData = async () => {
      const res = await fetchCollectionDetail(id);
      if (res) setCollectionInfo(res);
    };
    loadData();
  }, [id, fetchCollectionDetail]);

  let theme = WEEKLY_PALETTE[new Date().getDay()];
  if (collectionInfo?.date_key) {
    const date = new Date(collectionInfo.date_key);
    if (!isNaN(date.getDay())) theme = WEEKLY_PALETTE[date.getDay()];
  }

  const formattedItems = vocabularies.map((v) => ({
    id: v.id,
    ja: v.word,
    reading: v.pronunciation,
    romaji: "",
    vi: v.meaning,
    example: v.example_sentence,
    exampleTranslation: v.example_translation,
    img: v.user_image,
    memorized: v.is_memorized || false,
    audio_url: v.audio_url,
  }));

  const filteredItems = formattedItems.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "memorized") return item.memorized === true;
    if (activeTab === "learning") return item.memorized === false;
    return true;
  });

  const totalWords = formattedItems.length;

  const handleToggleMemorized = (id) => {
    console.log("Toggle memorized:", id);
  };

  const handleDeleteWord = async () => {
    if (!deletingItemId) return;
    try {
      await axiosPrivate.delete(`/api/saved-vocabularies/${deletingItemId}/`);
      const refreshed = await fetchCollectionDetail(id, true);
      if (refreshed) setCollectionInfo(refreshed);
      setSelectedItem(null);
      setShowDeleteConfirm(false);
      setDeletingItemId(null);
      showToast("Đã xóa từ thành công!", "success");
    } catch (error) {
      console.error("Lỗi xóa:", error);
      setShowDeleteConfirm(false);
      showToast("Xóa thất bại. Vui lòng thử lại.", "error");
    }
  };

  const openDeleteConfirm = (itemId) => {
    setDeletingItemId(itemId);
    setShowDeleteConfirm(true);
  };

  if (isLoading && !collectionInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F4F6]">
        <Loader2 className="w-10 h-10 animate-spin text-[#E85A4F]" />
      </div>
    );
  }

  return (
    /* Đổi nền thành màu #F4F4F6 trầm dịu, giảm chói mắt triệt để */
    <div className="min-h-screen bg-[#F4F4F6] font-sans pb-16">
      
      {/* Header Section */}
      <header className="px-6 pt-12 pb-4 flex flex-col gap-2 relative">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90"
            style={{ 
              backgroundColor: theme.main, 
              opacity: 0.9 
            }}
          >
            <ChevronLeft className="w-5 h-5 text-white stroke-[3]" />
          </button>
          
          <h1 
            className="text-[36px] font-bold tracking-tight"
            style={{ color: theme.main }}
          >
            {collectionInfo?.title || "Hôm nay"}
          </h1>
        </div>

        <div className="pl-[52px]">
          <span 
            className="px-3 py-1 rounded-lg text-[14px] font-medium"
            style={{ 
              backgroundColor: theme.bg, 
              color: theme.main 
            }}
          >
            {totalWords} từ
          </span>
        </div>
        
        {/* Đường kẻ ngang nhạt mờ tự nhiên hơn trên nền mới */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gray-200/50" />
      </header>

      {/* Grid danh sách từ vựng */}
      <main className="px-5 mt-6 grid grid-cols-2 gap-x-5 gap-y-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            /* Đổ shadow-sm dịu mắt giúp nổi bật card trắng tinh trên nền xám sữa nhạt */
            className="bg-white rounded-[28px] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.04)] p-3.5 flex flex-col transition-all active:scale-[0.97] cursor-pointer"
            onClick={() => setSelectedItem(item)}
          >
            {/* Vùng chứa ảnh: đồng bộ nền xám siêu nhạt dịu mắt */}
            <div className="relative w-full aspect-[4/3] rounded-[20px] overflow-hidden bg-[#F8F8FA] flex items-center justify-center p-2">
              {item.img ? (
                <img 
                  src={item.img} 
                  alt={item.ja} 
                  className="max-w-full max-h-full object-contain mix-blend-multiply" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <BookOpen size={28} />
                </div>
              )}
              {item.memorized && (
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                </div>
              )}
            </div>

            {/* Vùng chữ */}
            <div className="mt-4 px-1 text-left flex flex-col gap-1">
              <div className="text-[23px] font-bold text-[#1C1C1E] tracking-tight leading-snug">
                {item.ja}
              </div>
              <div className="text-[14px] text-[#8E8E93] font-normal truncate leading-normal">
                {item.vi}
              </div>
            </div>
          </div>
        ))}
      </main>

      {filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-28 text-gray-400">
          <p className="text-base font-medium opacity-50">Bộ sưu tập này chưa có từ nào</p>
        </div>
      )}

      {selectedItem && (
        <WordDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onToggleMemorized={handleToggleMemorized}
          onDelete={openDeleteConfirm}
        />
      )}

      {/* Modal xác nhận xóa */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60] flex items-center justify-center p-5">
          <div className="bg-white rounded-[32px] max-w-sm w-full p-6 shadow-2xl text-center border border-gray-50">
            <div className="mx-auto w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Xóa từ vựng</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Bạn có chắc chắn muốn xóa từ này khỏi bộ sưu tập không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingItemId(null);
                }}
                className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-2xl font-bold active:scale-95 transition-all text-sm"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteWord}
                className="flex-1 py-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl font-bold shadow-md active:scale-95 transition-all text-sm"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast thông báo */}
      {toast.show && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[70] px-4 w-full max-w-sm transition-all duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md ${
              toast.type === "success"
                ? "bg-emerald-500 text-white border-emerald-400/20"
                : "bg-rose-500 text-white border-rose-400/20"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm font-semibold flex-1">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionDetail;