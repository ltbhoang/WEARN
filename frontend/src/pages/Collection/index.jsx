// src/pages/Collection/index.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDataStore } from "../../store/dataStore";
import { Copy, MoreVertical, Search, Loader2, ImageOff } from "lucide-react";

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const {
    collections,
    fetchCollections,
    fetchCollectionDetail,
    collectionDetails,
    loading,
    removeItem,
  } = useDataStore();

  const safeCollections = Array.isArray(collections) ? collections : [];

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Khi có collections, fetch detail cho từng collection (nếu chưa có)
  useEffect(() => {
    const fetchDetails = async () => {
      for (const col of safeCollections) {
        if (!collectionDetails[col.id]) {
          await fetchCollectionDetail(col.id);
        }
      }
    };
    if (safeCollections.length > 0) {
      fetchDetails();
    }
  }, [safeCollections, collectionDetails, fetchCollectionDetail]);

  const getThemeByDate = (dateString) => {
    const date = new Date(dateString);
    const dayIndex = isNaN(date.getDay()) ? 0 : date.getDay();
    return WEEKLY_PALETTE[dayIndex];
  };

  const filteredCollections = safeCollections.filter((col) =>
    col.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Lấy danh sách ảnh đại diện (tối đa 4) từ collectionDetails
  // Lấy danh sách ảnh đại diện (tối đa 4) từ collectionDetails
  const getPreviewImages = (collectionId) => {
    const detail = collectionDetails[collectionId];
    if (!detail) return [];
    // Đọc từ vocabularies (fallback saved_vocabularies)
    const list = detail.vocabularies || detail.saved_vocabularies || [];
    const images = list.map((item) => item.user_image).filter((url) => url);
    return images.slice(0, 4);
  };

  // Lấy số từ vựng thực tế từ detail
  const getVocabCount = (collectionId) => {
    const detail = collectionDetails[collectionId];
    if (!detail) return 0;
    const list = detail.vocabularies || detail.saved_vocabularies || [];
    return list.length;
  };

  // ---- Xóa collection ----
  const openDeleteModal = (col, e) => {
    e.stopPropagation(); // không chuyển hướng sang chi tiết
    setCollectionToDelete(col);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCollectionToDelete(null);
    setDeleting(false);
  };

  const handleDeleteCollection = async () => {
    if (!collectionToDelete) return;
    setDeleting(true);
    try {
      await removeItem("collections", collectionToDelete.id);
      // Store đã xóa khỏi state, UI tự động cập nhật
      closeDeleteModal();
    } catch (err) {
      console.error("Lỗi xóa collection:", err);
      alert("Xóa thất bại! Vui lòng thử lại.");
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F8] pb-40 font-sans text-[#2D2D2D]">
      <header className="px-6 pt-10 pb-4">
        <div className="flex items-center gap-4 max-w-2xl mx-auto">
          <div>
            <h1 className="text-4xl font-black text-[#474747] leading-tight">
              Bộ sưu tập
            </h1>
            <p className="text-base text-[#8E8D8A] font-medium mt-1">
              Bạn đã học được {safeCollections.length} bộ từ rồi!
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
        ) : filteredCollections.length === 0 ? (
          <div className="text-center py-20 text-[#8E8D8A]">
            <p className="text-6xl mb-4">📭</p>
            <p className="text-lg font-medium">Chưa có bộ sưu tập nào</p>
            <p className="text-sm">Hãy tạo bộ sưu tập đầu tiên của bạn!</p>
          </div>
        ) : (
          filteredCollections.map((col) => {
            const folderTheme = getThemeByDate(col.date_key || col.created_at);
            const images = getPreviewImages(col.id);
            const count = getVocabCount(col.id);
            const displayImages = images.slice(0, 4);
            const remaining = images.length - 4;

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
                        {count} từ vựng
                      </span>
                    </div>
                    {/* Nút 3 chấm thay cho ChevronRight */}
                    <button
                      onClick={(e) => openDeleteModal(col, e)}
                      className="p-2 hover:bg-black/5 rounded-full transition-colors"
                      aria-label="Xóa bộ sưu tập"
                    >
                      <MoreVertical className="w-6 h-6 text-[#C7C7C7]" />
                    </button>
                  </div>

                  {/* Hiển thị ảnh từ user_image (URL) */}
                  <div className="flex gap-3 overflow-hidden mb-4">
                    {displayImages.length > 0 ? (
                      displayImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-sm shrink-0 bg-white/20"
                        >
                          <img
                            src={imgUrl}
                            alt="vocab"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = "none";
                              const parent = e.target.parentElement;
                              const fallback = document.createElement("div");
                              fallback.className =
                                "w-full h-full flex items-center justify-center text-[#8E8D8A] bg-gray-100";
                              fallback.textContent = "📷";
                              parent.appendChild(fallback);
                            }}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 text-[#8E8D8A] bg-white/50 px-4 py-2 rounded-xl">
                        <ImageOff className="w-5 h-5" />
                        <span className="text-sm font-medium">Chưa có ảnh</span>
                      </div>
                    )}
                    {remaining > 0 && (
                      <div className="w-16 h-16 rounded-2xl bg-white/50 backdrop-blur flex items-center justify-center text-xs font-bold text-[#8E8D8A] border-2 border-dashed border-white/60">
                        +{remaining}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <div className="text-xs text-[#8E8D8A] font-medium">
                      Ngày tạo:{" "}
                      {new Date(
                        col.date_key || col.created_at
                      ).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                </div>
              </section>
            );
          })
        )}
      </main>

      {/* Modal xác nhận xóa */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-fadeIn">
            <h3 className="text-xl font-bold text-[#474747] mb-2">
              Xóa bộ sưu tập?
            </h3>
            <p className="text-[#8E8D8A] mb-6">
              Bạn có chắc muốn xóa bộ sưu tập{" "}
              <span className="font-semibold text-[#474747]">
                "{collectionToDelete?.title}"
              </span>
              ? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeDeleteModal}
                className="flex-1 py-2.5 rounded-full bg-gray-100 text-gray-700 font-bold active:scale-[0.98] transition disabled:opacity-50"
                disabled={deleting}
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteCollection}
                className="flex-1 py-2.5 rounded-full bg-red-500 text-white font-bold active:scale-[0.98] transition disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionPage;
