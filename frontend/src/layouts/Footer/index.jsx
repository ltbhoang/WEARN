import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home, LayoutGrid, Camera, GraduationCap, User,
  CheckCircle2, XCircle
} from "lucide-react";
import CameraWeb from "../../components/CameraWeb";
import CaptureReviewModal from "../../components/CaptureReviewModal";
import { axiosPrivate } from "../../apis/axios";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCamera, setShowCamera] = useState(false);
  const [rawImageDataUrl, setRawImageDataUrl] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const handleNavClick = (path) => navigate(path);
  const handleOpenCamera = () => setShowCamera(true);
  const handleCloseCamera = () => setShowCamera(false);

  const handleCapture = (imageDataUrl) => {
    setRawImageDataUrl(imageDataUrl);
    setShowCamera(false);
    setShowReview(true);
  };

  // Lưu ảnh vào localStorage (URL hoặc base64)
  const saveImageToLocalStorage = (collectionId, vocabularyId, imageData) => {
    if (!imageData) return;
    const imageMap = JSON.parse(localStorage.getItem(`collection_${collectionId}_map`) || '{}');
    imageMap[vocabularyId] = imageData;
    localStorage.setItem(`collection_${collectionId}_map`, JSON.stringify(imageMap));
  };

  // ---- Lưu vocabulary ----
  const handleSave = async (vocabularyId, imageData) => {
    if (!vocabularyId) {
      showToast("Không có từ vựng để lưu. Vui lòng chọn kết quả khác.", "error");
      return;
    }
    if (!imageData) {
      showToast("Không có ảnh để lưu. Vui lòng thử lại.", "error");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const [year, month, day] = today.split("-");
    const displayTitle = `${day}/${month}/${year}`;
    let collectionId = null;

    try {
      // Tìm hoặc tạo collection
      const getColRes = await axiosPrivate.get("/api/collections/", { params: { date_key: today } });
      if (getColRes.data.length > 0) {
        collectionId = getColRes.data[0].id;
      } else {
        const createRes = await axiosPrivate.post("/api/collections/", { date_key: today, title: displayTitle });
        collectionId = createRes.data.id;
      }

      // Xác định user_image: chỉ gửi nếu imageData là URL hợp lệ
      const userImage = (imageData && imageData.startsWith('http')) ? imageData : null;

      // Lưu saved-vocabulary, kèm user_image nếu có
      await axiosPrivate.post("/api/saved-vocabularies/", {
        collection: collectionId,
        vocabulary: vocabularyId,
        user_image: userImage, // thêm trường user_image
      });

      // Lưu ảnh vào localStorage (dùng để hiển thị nhanh)
      saveImageToLocalStorage(collectionId, vocabularyId, imageData);
      showToast("Đã lưu vào bộ sưu tập của bạn!", "success");
      setShowReview(false);
      setRawImageDataUrl(null);
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.non_field_errors) {
        // Duplicate: cập nhật ảnh mới
        saveImageToLocalStorage(collectionId, vocabularyId, imageData);
        showToast("Đã cập nhật ảnh mới cho từ vựng này!", "success");
        setShowReview(false);
        setRawImageDataUrl(null);
      } else {
        const errorMsg = err.response?.data?.collection?.[0] ||
                         err.response?.data?.vocabulary?.[0] ||
                         err.response?.data?.detail ||
                         "Lỗi không xác định";
        showToast(`Lưu thất bại: ${errorMsg}`, "error");
      }
    }
  };

  const handleCancel = () => {
    setShowReview(false);
    setRawImageDataUrl(null);
  };

  const isActive = (path) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    if (path === "/collection") return location.pathname === "/collection" || location.pathname.startsWith("/collection/");
    if (path === "/practice") return location.pathname === "/practice" || location.pathname.startsWith("/practice/");
    if (path === "/profile") return location.pathname === "/profile" || location.pathname.startsWith("/profile/");
    return location.pathname === path;
  };

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-[#D8C3A5]/20 px-4 py-2 shadow-2xl z-10">
        <nav className="flex items-center justify-around max-w-md mx-auto">
          <button onClick={() => handleNavClick("/dashboard")} className={`flex flex-col items-center gap-0.5 transition-colors ${isActive("/dashboard") ? "text-[#E85A4F]" : "text-[#8E8D8A]"} hover:text-[#E85A4F]`}>
            <Home className="w-6 h-6 stroke-[1.5]" /><span className="text-[11px] font-black uppercase tracking-wider">Trang chủ</span>
          </button>
          <button onClick={() => handleNavClick("/collection")} className={`flex flex-col items-center gap-0.5 transition-colors ${isActive("/collection") ? "text-[#E85A4F]" : "text-[#8E8D8A]"} hover:text-[#E85A4F]`}>
            <LayoutGrid className="w-6 h-6 stroke-[1.5]" /><span className="text-[11px] font-black uppercase tracking-wider">Bộ sưu tập</span>
          </button>
          <button onClick={handleOpenCamera} className="relative -top-6 w-16 h-16 bg-gradient-to-br from-[#E85A4F] to-[#E98074] rounded-2xl text-white flex items-center justify-center shadow-xl transition-all hover:scale-110 hover:rotate-3 border-4 border-white">
            <Camera className="w-8 h-8 stroke-[1.5]" />
          </button>
          <button onClick={() => handleNavClick("/streak")} className={`flex flex-col items-center gap-0.5 transition-colors ${isActive("/streak") ? "text-[#E85A4F]" : "text-[#8E8D8A]"} hover:text-[#E85A4F]`}>
            <GraduationCap className="w-6 h-6 stroke-[1.5]" /><span className="text-[11px] font-black uppercase tracking-wider">Thành tựu</span>
          </button>
          <button onClick={() => handleNavClick("/profile")} className={`flex flex-col items-center gap-0.5 transition-colors ${isActive("/profile") ? "text-[#E85A4F]" : "text-[#8E8D8A]"} hover:text-[#E85A4F]`}>
            <User className="w-6 h-6 stroke-[1.5]" /><span className="text-[11px] font-black uppercase tracking-wider">Hồ sơ</span>
          </button>
        </nav>
      </footer>

      {showCamera && <CameraWeb onCapture={handleCapture} onClose={handleCloseCamera} />}

      {showReview && rawImageDataUrl && (
        <CaptureReviewModal
          imageUrl={null}
          rawImageDataUrl={rawImageDataUrl}
          onSave={(vocabularyId, imageData) => handleSave(vocabularyId, imageData)}
          onCancel={handleCancel}
        />
      )}

      {toast.show && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[70] px-1 w-full max-w-sm animate-bounce-short">
          <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md ${toast.type === "success" ? "bg-gradient-to-r from-emerald-500/95 to-teal-600/95 text-white" : "bg-gradient-to-r from-rose-500/95 to-red-600/95 text-white"}`}>
            {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <p className="text-sm font-semibold">{toast.message}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;