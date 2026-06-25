import React, { useState, useEffect } from "react";
import { axiosPrivate } from "../apis/axios";

const CaptureReviewModal = ({
  imageUrl,
  rawImageDataUrl,
  onSave,
  onCancel,
}) => {
  const [predictions, setPredictions] = useState([]);
  const [vocabulary, setVocabulary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [selectedConfidence, setSelectedConfidence] = useState(0);
  const [selectedMeaning, setSelectedMeaning] = useState("");
  const [selectedJapanese, setSelectedJapanese] = useState("");
  const [selectedRomaji, setSelectedRomaji] = useState("");
  const [error, setError] = useState(null);
  const [fetchingVocab, setFetchingVocab] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [remoteImageUrl, setRemoteImageUrl] = useState(null);

  const AI_URL = "https://lily-prescribe-avenue.ngrok-free.dev/predict-base64";
  const today = new Date().toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
  });

  useEffect(() => {
    if (rawImageDataUrl) {
      setImageBase64(rawImageDataUrl);
      localStorage.setItem("captured_image_base64", rawImageDataUrl);
      setLocalPreviewUrl(rawImageDataUrl);
    } else {
      const saved = localStorage.getItem("captured_image_base64");
      if (saved) {
        setImageBase64(saved);
        setLocalPreviewUrl(saved);
      }
    }
  }, [rawImageDataUrl]);

  useEffect(() => {
    if (imageBase64) {
      detect(imageBase64);
    }
  }, [imageBase64]);

  const detect = async (base64) => {
    try {
      setError(null);
      setLoading(true);
      setRemoteImageUrl(null);

      const res = await fetch(AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: base64 }),
      });
      if (!res.ok) throw new Error(`AI service error: HTTP ${res.status}`);
      const data = await res.json();

      if (data.success && data.predictions.length) {
        setPredictions(data.predictions);
        const first = data.predictions[0];
        setSelectedLabel(first.label);
        setSelectedKey(first.key || "");
        setSelectedConfidence(first.confidence);
        setSelectedMeaning(first.meaning || "không xác định");
        setSelectedJapanese(first.japanese || "❓");
        setSelectedRomaji(first.romaji || "");

        if (data.image_url) {
          setRemoteImageUrl(data.image_url);
          console.log("📸 Nhận được ảnh segment:", data.image_url);
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

  // Fetch vocabulary (nếu key khác "unknown")
  useEffect(() => {
    if (!selectedKey || selectedKey === "unknown") {
      setVocabulary({
        id: null,
        word: selectedJapanese || "❓",
        meaning: selectedMeaning || "không xác định",
        pronunciation: selectedRomaji || "",
      });
      setFetchingVocab(false);
      return;
    }

    const fetchVocab = async () => {
      setFetchingVocab(true);
      try {
        const className = `imagenet_${selectedKey}`;
        const response = await axiosPrivate.get("/api/vocabularies/", {
          params: { class_name: className },
        });
        const data = response.data;
        const vocabList = data.results || data;
        if (Array.isArray(vocabList) && vocabList.length) {
          setVocabulary(vocabList[0]);
        } else {
          // Không tìm thấy => tạo vocab giả
          setVocabulary({
            id: null,
            word: selectedJapanese || "❓",
            meaning: selectedMeaning || "không xác định",
            pronunciation: selectedRomaji || "",
          });
          console.warn(`Không tìm thấy từ vựng cho class_name: ${className}`);
        }
      } catch (err) {
        console.error("Vocab error:", err);
        setVocabulary({
          id: null,
          word: selectedJapanese || "❓",
          meaning: selectedMeaning || "không xác định",
          pronunciation: selectedRomaji || "",
        });
        if (err.response?.status === 401) {
          setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        }
      } finally {
        setFetchingVocab(false);
      }
    };

    fetchVocab();
  }, [selectedKey, selectedJapanese, selectedMeaning, selectedRomaji]);

  const handleSaveClick = () => {
    if (vocabulary?.id) {
      const imageToSave = remoteImageUrl || localStorage.getItem("captured_image_base64") || imageBase64;
      onSave(vocabulary.id, imageToSave);
    } else {
      console.warn("⚠️ Không có vocabulary.id để lưu");
    }
  };

  const handleCancel = () => onCancel();

  if (error) {
    return (
      <div className="fixed inset-0 bg-[#F8F9FA] z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 text-center shadow-xl max-w-sm w-full">
          <p className="text-red-500 font-medium">❌ Lỗi: {error}</p>
          <button
            onClick={handleCancel}
            className="mt-4 px-6 py-2 bg-gray-200 rounded-full text-sm font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const isConfidenceValid = selectedConfidence >= 20;
  const displayImageUrl = remoteImageUrl || localPreviewUrl;
  const hasValidVocab = vocabulary?.id !== null && vocabulary?.id !== undefined;

  return (
    <div className="fixed inset-0 bg-[#F9F9F6] z-50 flex flex-col p-6 font-sans select-none overflow-hidden">
      <div className="max-w-md w-full mx-auto flex flex-col h-full">
        <div className="flex items-center gap-4 mb-4 mt-2">
          <button
            onClick={handleCancel}
            className="w-11 h-11 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-700 active:scale-95 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={3}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h2 className="text-4xl font-bold text-[#333333] tracking-tight">{today}</h2>
        </div>

        <div className="relative w-full bg-[#FFBE98] rounded-[2.5rem] p-6 py-10 my-3 flex flex-col items-center justify-evenly flex-1 shadow-sm">
          {hasValidVocab && !fetchingVocab && !loading && isConfidenceValid && (
            <button className="absolute top-6 right-6 w-11 h-11 bg-[#FF6550] text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.063.922-2.063 2.063v4.875c0 1.141.922 2.062 2.063 2.062h1.932l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06z" />
              </svg>
            </button>
          )}

          <div className="w-44 h-48 flex items-center justify-center drop-shadow-xl">
            {displayImageUrl ? (
              <img
                src={displayImageUrl}
                alt="Object"
                className="max-w-full max-h-full object-contain rounded-[2rem] border-4 border-white bg-white/10 shadow-inner"
                onError={() => {
                  if (remoteImageUrl) {
                    console.warn("⚠️ Ảnh segment bị lỗi, fallback về ảnh gốc");
                    setRemoteImageUrl(null);
                  }
                }}
              />
            ) : (
              <div className="w-full h-full bg-white/20 rounded-2xl flex items-center justify-center text-white">
                Đang tải ảnh...
              </div>
            )}
          </div>

          <div className="w-full text-center flex flex-col items-center justify-center mt-4">
            {loading ? (
              <p className="text-white font-semibold text-lg animate-pulse">🔍 Đang nhận diện...</p>
            ) : fetchingVocab ? (
              <p className="text-white font-semibold text-lg animate-pulse">📖 Đang tra từ điển...</p>
            ) : !isConfidenceValid ? (
              <div className="bg-white/20 rounded-2xl p-5 mx-2">
                <p className="text-white font-bold text-xl">⚠️ Độ chính xác thấp ({selectedConfidence}%)</p>
                <p className="text-white/80 text-base mt-1">Hệ thống chưa nhận diện rõ vật thể.</p>
                <p className="text-white/60 text-sm mt-2">Vui lòng chụp lại hoặc chọn kết quả khác.</p>
              </div>
            ) : !hasValidVocab ? (
              <div className="bg-white/20 rounded-2xl p-5 mx-2">
                <p className="text-white font-bold text-xl">🤖 Model chưa hỗ trợ từ này</p>
                <p className="text-white/80 text-base mt-1">AI nhận diện được vật nhưng chưa có trong từ điển.</p>
                <p className="text-white/60 text-sm mt-2">Chúng tôi sẽ cập nhật sớm!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1 w-full px-4">
                <h1 className="text-6xl font-black text-white tracking-wide drop-shadow-sm leading-tight">
                  {vocabulary.word}
                </h1>
                <p className="text-3xl font-bold text-white/90 tracking-wide mt-2">{vocabulary.meaning}</p>
                {vocabulary.pronunciation && (
                  <p className="text-sm font-medium text-white/70 mt-3 bg-black/5 px-3 py-0.5 rounded-full inline-block mx-auto">
                    /{vocabulary.pronunciation}/
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full mt-2 pb-10">
          <button
            onClick={handleSaveClick}
            disabled={!hasValidVocab || fetchingVocab || !isConfidenceValid}
            className={`w-full py-4 rounded-full font-extrabold text-xl text-white flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] ${
              !hasValidVocab || fetchingVocab || !isConfidenceValid
                ? "bg-gray-300 cursor-not-allowed shadow-none"
                : "bg-[#FF6550] hover:bg-[#e0533f]"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.235 1.34 1.964 2.374 1.266l5.376-3.626 5.376 3.626c1.034.698 2.374-.03 2.374-1.266V3.375c0-1.036-.84-1.875-1.875-1.875H5.625z" />
            </svg>
            {hasValidVocab ? "Thêm vào bộ sưu tập" : "Không thể lưu (chưa có từ điển)"}
          </button>

          <div className="flex gap-4">
            <button
              onClick={handleCancel}
              className="flex-1 py-3.5 rounded-full bg-[#FFF0E8] text-[#FF6550] font-extrabold text-base active:scale-[0.98] transition flex items-center justify-center gap-1.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={3}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31... " />
              </svg>
              Quét lại
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 py-3.5 rounded-full bg-white border-2 border-gray-100 text-gray-700 font-extrabold text-base shadow-sm active:scale-[0.98] transition flex items-center justify-center gap-1.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={3}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788... " />
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