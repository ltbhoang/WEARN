import React, { useState, useEffect } from "react";
import { axiosPrivate } from "../apis/axios";

const CaptureReviewModal = ({ imageUrl, rawImageDataUrl, onSave, onCancel }) => {
  const [predictions, setPredictions] = useState([]);
  const [vocabulary, setVocabulary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [selectedConfidence, setSelectedConfidence] = useState(0);
  const [error, setError] = useState(null);
  const [fetchingVocab, setFetchingVocab] = useState(false);
  const [maskImageUrl, setMaskImageUrl] = useState(null);
  const [maskLoadError, setMaskLoadError] = useState(false);
  
  // Ảnh gốc tạm thời từ base64 (hiển thị ngay, không lỗi 404)
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);

  const AI_URL = "https://lily-prescribe-avenue.ngrok-free.dev/predict-base64";
  const today = new Date().toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
  });

  // Tạo local preview từ base64 khi component mount
  useEffect(() => {
    if (rawImageDataUrl) {
      setLocalPreviewUrl(rawImageDataUrl);
    }
  }, [rawImageDataUrl]);

  useEffect(() => {
    const detect = async () => {
      if (!rawImageDataUrl) return;
      try {
        setError(null);
        setLoading(true);
        setMaskImageUrl(null);
        setMaskLoadError(false);

        const res = await fetch(AI_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_base64: rawImageDataUrl }),
        });
        if (!res.ok) throw new Error(`AI service error: HTTP ${res.status}`);
        const data = await res.json();

        if (data.success && data.predictions.length) {
          setPredictions(data.predictions);
          const first = data.predictions[0];
          setSelectedLabel(first.label);
          setSelectedConfidence(first.confidence);

          if (data.mask_url) {
            console.log("✅ mask_url nhận được:", data.mask_url);
            const img = new Image();
            img.onload = () => {
              console.log("✅ Ảnh mask tải thành công");
              setMaskImageUrl(data.mask_url);
            };
            img.onerror = (err) => {
              console.error("❌ Ảnh mask tải thất bại:", err);
              setMaskLoadError(true);
            };
            img.src = data.mask_url;
          } else {
            console.warn("⚠️ Không có mask_url trong response");
            setMaskLoadError(true);
          }
        } else {
          throw new Error(data.error || "No predictions");
        }
      } catch (err) {
        console.error("AI error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    detect();
  }, [rawImageDataUrl]);

  useEffect(() => {
    if (!selectedLabel) return;

    const fetchVocab = async () => {
      setFetchingVocab(true);
      try {
        const tryFetch = async (className) => {
          try {
            const response = await axiosPrivate.get("/api/vocabularies/", {
              params: { class_name: className },
            });
            const data = response.data;
            return data.length ? data[0] : null;
          } catch (err) {
            console.error(`Error fetching ${className}:`, err);
            return null;
          }
        };

        let vocab = await tryFetch(selectedLabel);
        if (!vocab) {
          vocab = await tryFetch(`extra_${selectedLabel}`);
        }
        setVocabulary(vocab);
      } catch (err) {
        console.error("Vocab error:", err);
        setVocabulary(null);
        if (err.response?.status === 401) {
          setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        }
      } finally {
        setFetchingVocab(false);
      }
    };

    fetchVocab();
  }, [selectedLabel]);

  const handleSaveClick = () => {
    if (vocabulary?.id) {
      console.log("💾 Lưu với maskImageUrl:", maskImageUrl);
      onSave(vocabulary.id, maskImageUrl);
    } else {
      console.warn("⚠️ Không có vocabulary.id để lưu");
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-[#F8F9FA] z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 text-center shadow-xl max-w-sm w-full">
          <p className="text-red-500 font-medium">❌ Lỗi: {error}</p>
          <button onClick={onCancel} className="mt-4 px-6 py-2 bg-gray-200 rounded-full text-sm font-medium">Đóng</button>
        </div>
      </div>
    );
  }

  const isConfidenceValid = selectedConfidence >= 60;
  
  // 🔄 Ưu tiên mask nếu có, nếu không thì dùng ảnh gốc base64
  const displayImageUrl = (maskImageUrl && !maskLoadError) ? maskImageUrl : localPreviewUrl;

  return (
    <div className="fixed inset-0 bg-[#F9F9F6] z-50 flex flex-col p-6 font-sans select-none overflow-hidden">
      <div className="max-w-md w-full mx-auto flex flex-col h-full">
        {/* TOP BAR */}
        <div className="flex items-center gap-4 mb-4 mt-2">
          <button onClick={onCancel} className="w-11 h-11 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-700 active:scale-95 transition">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h2 className="text-4xl font-bold text-[#333333] tracking-tight">{today}</h2>
        </div>

        {/* MAIN CARD */}
        <div className="relative w-full bg-[#FFBE98] rounded-[2.5rem] p-6 py-10 my-3 flex flex-col items-center justify-evenly flex-1 shadow-sm">
          {vocabulary && !fetchingVocab && !loading && isConfidenceValid && (
            <button className="absolute top-6 right-6 w-11 h-11 bg-[#FF6550] text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.063.922-2.063 2.063v4.875c0 1.141.922 2.062 2.063 2.062h1.932l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06z" />
              </svg>
            </button>
          )}

          {/* ẢNH: dùng local preview base64 thay vì URL của Django */}
          <div className="w-44 h-48 flex items-center justify-center drop-shadow-xl">
            {displayImageUrl ? (
              <img 
                src={displayImageUrl} 
                alt="Object" 
                className="max-w-full max-h-full object-contain rounded-[2rem] border-4 border-white bg-white/10 shadow-inner"
                onError={(e) => {
                  console.error("Lỗi hiển thị ảnh:", e.target.src);
                  if (maskImageUrl && e.target.src === maskImageUrl) setMaskLoadError(true);
                }}
              />
            ) : (
              <div className="w-full h-full bg-white/20 rounded-2xl flex items-center justify-center text-white">
                Đang tải ảnh...
              </div>
            )}
          </div>

          {!loading && maskLoadError && (
            <div className="absolute top-6 left-6 bg-amber-500/80 text-white text-xs font-bold px-3 py-1 rounded-full">
              ⚠️ Hiển thị ảnh gốc (mask lỗi)
            </div>
          )}

          {/* Nội dung */}
          <div className="w-full text-center flex flex-col items-center justify-center mt-4">
            {loading ? (
              <p className="text-white font-semibold text-lg animate-pulse">🔍 Đang nhận diện...</p>
            ) : fetchingVocab ? (
              <p className="text-white font-semibold text-lg animate-pulse">📖 Đang tra từ điển...</p>
            ) : vocabulary && isConfidenceValid ? (
              <div className="flex flex-col gap-1 w-full px-4">
                <h1 className="text-6xl font-black text-white tracking-wide drop-shadow-sm leading-tight">{vocabulary.word}</h1>
                <p className="text-3xl font-bold text-white/90 tracking-wide mt-2">{vocabulary.meaning}</p>
                {vocabulary.pronunciation && (
                  <p className="text-sm font-medium text-white/70 mt-3 bg-black/5 px-3 py-0.5 rounded-full inline-block mx-auto">/{vocabulary.pronunciation}/</p>
                )}
              </div>
            ) : vocabulary && !isConfidenceValid ? (
              <div className="bg-white/20 rounded-2xl p-5 mx-2">
                <p className="text-white font-bold text-xl">⚠️ Độ chính xác thấp ({selectedConfidence}%)</p>
                <p className="text-white/80 text-base mt-1">Hệ thống chưa nhận diện rõ vật thể.</p>
                <p className="text-white/60 text-sm mt-2">Vui lòng chụp lại hoặc chọn kết quả khác.</p>
              </div>
            ) : (
              <p className="text-white/90 font-bold text-lg px-6">Không tìm thấy từ vựng cho "{selectedLabel}"</p>
            )}
          </div>
        </div>

        {/* CHIPS */}
        {predictions.length > 0 && (
          <div className="px-2 mb-3 mt-1">
            <div className="flex flex-wrap gap-2 justify-center">
              {predictions.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedLabel(p.label);
                    setSelectedConfidence(p.confidence);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedLabel === p.label ? "bg-[#FF6550] text-white shadow-sm" : "bg-white text-gray-400 border border-gray-100"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* BOTTOM BUTTONS */}
        <div className="flex flex-col gap-3 w-full mt-2 pb-10">
          <button
            onClick={handleSaveClick}
            disabled={!vocabulary || fetchingVocab || !isConfidenceValid}
            className={`w-full py-4 rounded-full font-extrabold text-xl text-white flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] ${
              !vocabulary || fetchingVocab || !isConfidenceValid
                ? "bg-gray-300 cursor-not-allowed shadow-none"
                : "bg-[#FF6550] hover:bg-[#e0533f]"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.235 1.34 1.964 2.374 1.266l5.376-3.626 5.376 3.626c1.034.698 2.374-.03 2.374-1.266V3.375c0-1.036-.84-1.875-1.875-1.875H5.625z" />
            </svg>
            Thêm vào bộ sưu tập
          </button>

          <div className="flex gap-4">
            <button onClick={onCancel} className="flex-1 py-3.5 rounded-full bg-[#FFF0E8] text-[#FF6550] font-extrabold text-base active:scale-[0.98] transition flex items-center justify-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              Quét lại
            </button>
            <button onClick={onCancel} className="flex-1 py-3.5 rounded-full bg-white border-2 border-gray-100 text-gray-700 font-extrabold text-base shadow-sm active:scale-[0.98] transition flex items-center justify-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaptureReviewModal;