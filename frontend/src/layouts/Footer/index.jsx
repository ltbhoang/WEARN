import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  LayoutGrid, 
  Camera, 
  GraduationCap, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle 
} from "lucide-react";
import CameraWeb from "../../components/CameraWeb";
import CaptureReviewModal from "../../components/CaptureReviewModal";
import { axiosPrivate } from "../../apis/axios";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState(null);
  const [maskImageUrl, setMaskImageUrl] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const handleNavClick = (path) => navigate(path);
  const handleOpenCamera = () => setShowCamera(true);
  const handleCloseCamera = () => setShowCamera(false);

  const handleCapture = async (imageDataUrl) => {
    try {
      const uploadRes = await axiosPrivate.post("/api/upload-temp-image/", {
        image_base64: imageDataUrl,
      });
      setCapturedImageUrl(uploadRes.data.image_url);
      setMaskImageUrl(null);
      setShowCamera(false);
      setShowReview(true);
    } catch (err) {
      console.error("Upload error:", err);
      if (err.response?.status === 401) showToast("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.", "error");
      else showToast("Không thể tải ảnh lên server. Vui lòng thử lại.", "error");
      setShowCamera(false);
    }
  };

  const handleReplaceImage = async (collectionId, vocabularyId, newImageUrl) => {
    console.log("🔄 handleReplaceImage - newImageUrl:", newImageUrl);
    try {
      const findRes = await axiosPrivate.get("/api/saved-vocabularies/", {
        params: { collection: collectionId, vocabulary: vocabularyId },
      });
      const existingItem = findRes.data.find(
        (item) => item.collection === collectionId && item.vocabulary === vocabularyId
      );
      if (existingItem) {
        await axiosPrivate.patch(`/api/saved-vocabularies/${existingItem.id}/`, {
          user_image: newImageUrl,
        });
        showToast("Đã cập nhật ảnh thành công!", "success");
        setShowReview(false);
        setCapturedImageUrl(null);
        setMaskImageUrl(null);
      } else {
        showToast("Không tìm thấy bản ghi cũ để cập nhật.", "error");
      }
    } catch (updateErr) {
      console.error("Update error:", updateErr);
      showToast("Cập nhật thất bại. Vui lòng thử lại.", "error");
    } finally {
      setShowReplaceConfirm(false);
      setPendingPayload(null);
    }
  };

  const handleSave = async (vocabularyId, imageToSave = null) => {
    console.log("📸 handleSave - imageToSave (mask):", imageToSave);
    console.log("📸 handleSave - capturedImageUrl (gốc):", capturedImageUrl);
    const finalImage = imageToSave || capturedImageUrl;
    console.log("📸 finalImage sẽ lưu:", finalImage);

    if (!vocabularyId) {
      showToast("Không có từ vựng để lưu. Vui lòng chọn kết quả khác.", "error");
      return;
    }
    if (!finalImage) {
      showToast("Không có ảnh để lưu. Vui lòng thử lại.", "error");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const [year, month, day] = today.split("-");
    const displayTitle = `${day}/${month}/${year}`;
    let collectionId = null;

    try {
      const getColRes = await axiosPrivate.get("/api/collections/", {
        params: { date_key: today },
      });
      const collections = getColRes.data;

      if (collections.length > 0) {
        collectionId = collections[0].id;
      } else {
        const createRes = await axiosPrivate.post("/api/collections/", {
          date_key: today,
          title: displayTitle,
        });
        collectionId = createRes.data.id;
      }

      const payload = {
        collection: collectionId,
        vocabulary: vocabularyId,
        user_image: finalImage,
      };
      console.log("🚀 Payload gửi lên API:", payload);
      const response = await axiosPrivate.post("/api/saved-vocabularies/", payload);
      console.log("✅ Response từ server:", response.data);
      showToast("Đã lưu vào bộ sưu tập của bạn!", "success");
      setShowReview(false);
      setCapturedImageUrl(null);
      setMaskImageUrl(null);
    } catch (err) {
      console.error("Save error:", err);
      if (err.response) {
        if (err.response.status === 400 && err.response.data?.non_field_errors) {
          setPendingPayload({ collectionId, vocabularyId, newImageUrl: finalImage });
          setShowReplaceConfirm(true);
        } else {
          const errorMsg =
            err.response.data?.collection?.[0] ||
            err.response.data?.vocabulary?.[0] ||
            err.response.data?.detail ||
            "Lỗi không xác định";
          showToast(`Lưu thất bại: ${errorMsg}`, "error");
        }
      } else if (err.request) {
        showToast("Không thể kết nối đến server. Vui lòng kiểm tra mạng.", "error");
      } else {
        showToast(`Lỗi: ${err.message}`, "error");
      }
    }
  };

  const handleCancel = async () => {
    if (capturedImageUrl) {
      try {
        await axiosPrivate.post("/api/delete-temp-image/", { image_url: capturedImageUrl });
      } catch (err) {
        console.error("Xóa ảnh tạm thất bại:", err);
      }
    }
    setShowReview(false);
    setCapturedImageUrl(null);
    setMaskImageUrl(null);
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
            <Home className="w-6 h-6 stroke-[1.5]" />
            <span className="text-[11px] font-black uppercase tracking-wider">Trang chủ</span>
          </button>
          <button onClick={() => handleNavClick("/collection")} className={`flex flex-col items-center gap-0.5 transition-colors ${isActive("/collection") ? "text-[#E85A4F]" : "text-[#8E8D8A]"} hover:text-[#E85A4F]`}>
            <LayoutGrid className="w-6 h-6 stroke-[1.5]" />
            <span className="text-[11px] font-black uppercase tracking-wider">Bộ sưu tập</span>
          </button>
          <button onClick={handleOpenCamera} className="relative -top-6 w-16 h-16 bg-gradient-to-br from-[#E85A4F] to-[#E98074] rounded-2xl text-white flex items-center justify-center shadow-xl transition-all hover:scale-110 hover:rotate-3 border-4 border-white">
            <Camera className="w-8 h-8 stroke-[1.5]" />
          </button>
          <button onClick={() => handleNavClick("/streak")} className={`flex flex-col items-center gap-0.5 transition-colors ${isActive("/streak") ? "text-[#E85A4F]" : "text-[#8E8D8A]"} hover:text-[#E85A4F]`}>
            <GraduationCap className="w-6 h-6 stroke-[1.5]" />
            <span className="text-[11px] font-black uppercase tracking-wider">Luyện tập</span>
          </button>
          <button onClick={() => handleNavClick("/profile")} className={`flex flex-col items-center gap-0.5 transition-colors ${isActive("/profile") ? "text-[#E85A4F]" : "text-[#8E8D8A]"} hover:text-[#E85A4F]`}>
            <User className="w-6 h-6 stroke-[1.5]" />
            <span className="text-[11px] font-black uppercase tracking-wider">Hồ sơ</span>
          </button>
        </nav>
      </footer>

      {showCamera && <CameraWeb onCapture={handleCapture} onClose={handleCloseCamera} />}
      {showReview && capturedImageUrl && (
        <CaptureReviewModal
          imageUrl={capturedImageUrl}
          onSave={(vocabularyId, maskUrl) => {
            if (maskUrl) setMaskImageUrl(maskUrl);
            handleSave(vocabularyId, maskUrl || capturedImageUrl);
          }}
          onCancel={handleCancel}
        />
      )}

      {showReplaceConfirm && pendingPayload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 transition-all animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center border border-gray-100">
            <div className="mx-auto w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4 shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Từ vựng đã tồn tại</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-6 px-2">
              Bạn đã lưu từ vựng này trong hôm nay rồi. Bạn có muốn <span className="font-semibold text-gray-700">thay thế hình ảnh cũ</span> bằng ảnh mới này không?
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setShowReplaceConfirm(false); setPendingPayload(null); setShowReview(false); setCapturedImageUrl(null); setMaskImageUrl(null); }} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 active:scale-95 transition-all text-sm">
                Hủy bỏ
              </button>
              <button onClick={() => handleReplaceImage(pendingPayload.collectionId, pendingPayload.vocabularyId, pendingPayload.newImageUrl)} className="flex-1 py-3 bg-gradient-to-r from-[#E85A4F] to-[#E98074] text-white rounded-2xl font-bold shadow-lg shadow-[#E85A4F]/30 hover:opacity-95 active:scale-95 transition-all text-sm">
                Thay thế
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[70] px-1 w-full max-w-sm transition-all duration-300 ease-out animate-bounce-short">
          <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md ${toast.type === "success" ? "bg-gradient-to-r from-emerald-500/95 to-teal-600/95 text-white border-emerald-400/20 shadow-emerald-500/20" : "bg-gradient-to-r from-rose-500/95 to-red-600/95 text-white border-rose-400/20 shadow-rose-500/20"}`}>
            <div className="flex-shrink-0 bg-white/20 p-1 rounded-lg">
              {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-white" /> : <XCircle className="w-5 h-5 text-white" />}
            </div>
            <p className="text-sm font-semibold tracking-wide flex-1 leading-snug">{toast.message}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;