// CharacterPracticePage.jsx
import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useKanaStore } from "../../store/kanaStore";
import { useKanjiStore } from "../../store/kanjiStore";
import { ChevronLeft, Eye, EyeOff, RotateCcw, Volume2 } from "lucide-react";
import CustomCanvas from "../../components/Canvas";
import compareImages from "../../utils/compareImages";

const KanaPracticePage = ({ type }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isKanji = type === "kanji";

  // Chọn store theo loại
  const kanaStore = useKanaStore();
  const kanjiStore = useKanjiStore();
  const store = isKanji ? kanjiStore : kanaStore;

  // Lấy dữ liệu đúng theo loại – ĐÂY LÀ PHẦN SỬA QUAN TRỌNG
  const character = isKanji ? store.currentKanji : store.currentKana;
  const fetchDetail = isKanji ? store.fetchKanjiDetail : store.fetchKanaDetail;
  const getProgress = isKanji ? store.getKanjiProgress : store.getKanaProgress;
  const progress = isKanji ? store.kanjiProgress?.[id] : store.kanaProgress?.[id];
  const storeLoading = store.loading;

  const [currentStroke, setCurrentStroke] = useState(0);
  const [currentDrawnStroke, setCurrentDrawnStroke] = useState(null);
  const [showGuide, setShowGuide] = useState(true);
  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dynamicHint, setDynamicHint] = useState("");
  const [autoResetPending, setAutoResetPending] = useState(false);
  const resetTimeoutRef = useRef(null);
  const canvasRef = useRef(null);

  const showTemporaryHint = (text) => {
    setDynamicHint(text);
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    const timeoutId = setTimeout(() => {
      setDynamicHint("");
    }, 2000);
    if (window._hintTimeout) clearTimeout(window._hintTimeout);
    window._hintTimeout = timeoutId;
  };

  useEffect(() => {
    if (id) {
      fetchDetail(id);
      getProgress(id);
    }
  }, [id, fetchDetail, getProgress]);

  const strokes = character?.strokes || [];
  const totalStrokes = strokes.length;

  useEffect(() => {
    if (progress && strokes.length > 0) {
      const completedCount = progress.completed_strokes?.length || 0;
      if (
        completedCount !== currentStroke &&
        completedCount <= strokes.length
      ) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentStroke(completedCount);
        setCurrentDrawnStroke(null);
      }
    }
  }, [progress, strokes, currentStroke]);

  const removeStyleAndAnimation = (svgString) => {
    if (!svgString) return "";
    let cleaned = svgString.replace(/<style>[\s\S]*?<\/style>/g, "");
    cleaned = cleaned.replace(/\s*animation:[^;]*;?/g, "");
    cleaned = cleaned.replace(/\s*stroke-dasharray:[^;]*;?/g, "");
    cleaned = cleaned.replace(/\s*stroke-dashoffset:[^;]*;?/g, "");
    return cleaned;
  };

  const completedStrokeStyle = (strokeSvg) => {
    if (!strokeSvg) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(strokeSvg, "image/svg+xml");
    const svg = doc.documentElement;
    const path = svg.querySelector("path");
    if (!path) return "";
    const newSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    newSvg.setAttribute("viewBox", "0 0 1024 1024");
    newSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    newSvg.setAttribute("width", "100%");
    newSvg.setAttribute("height", "100%");
    newSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    const newPath = path.cloneNode(true);
    newPath.setAttribute("fill", "none");
    newPath.setAttribute("stroke", "#10B981");
    newPath.setAttribute("stroke-width", "40");
    newPath.setAttribute("stroke-linecap", "round");
    newPath.setAttribute("stroke-linejoin", "round");
    newSvg.appendChild(newPath);
    return newSvg.outerHTML;
  };

  const getCurrentDrawnStrokeSvg = (strokeSvg) => {
    return completedStrokeStyle(strokeSvg);
  };

  const getHintSvgForStroke = (strokeSvg) => {
    if (!strokeSvg) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(strokeSvg, "image/svg+xml");
    const svg = doc.documentElement;
    const path = svg.querySelector("path");
    if (!path) return "";
    const newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    newSvg.setAttribute("viewBox", "0 0 1024 1024");
    newSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    newSvg.setAttribute("width", "100%");
    newSvg.setAttribute("height", "100%");
    newSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    const newPath = path.cloneNode(true);
    newPath.setAttribute("fill", "none");
    newPath.setAttribute("stroke", "#3B82F6");
    newPath.setAttribute("stroke-width", "30");
    newPath.setAttribute("stroke-linecap", "round");
    newPath.setAttribute("stroke-linejoin", "round");
    const length = 12000;
    newPath.setAttribute("stroke-dasharray", length);
    newPath.setAttribute("stroke-dashoffset", length);
    newPath.style.animation = "draw 3s linear infinite";
    newSvg.appendChild(newPath);
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = `@keyframes draw { from { stroke-dashoffset: ${length}; } to { stroke-dashoffset: 0; } }`;
    newSvg.appendChild(style);
    return newSvg.outerHTML;
  };

  const bgSvgStyle = (svgString) => {
    if (!svgString) return "";
    let cleaned = removeStyleAndAnimation(svgString);
    return cleaned
      .replace(/stroke="[^"]*"/g, 'stroke="#E5E7EB"')
      .replace(/stroke-width="[^"]*"/g, 'stroke-width="6"')
      .replace(/fill="[^"]*"/g, 'fill="none"')
      .replace(/<svg/g, '<svg style="opacity:0.6"');
  };

  const handleResetLesson = () => {
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    setAutoResetPending(false);
    // Cập nhật store tương ứng
    if (isKanji) {
      useKanjiStore.setState((state) => ({
        kanjiProgress: {
          ...state.kanjiProgress,
          [id]: {
            completed_strokes: [],
            completed: false,
          },
        },
      }));
    } else {
      useKanaStore.setState((state) => ({
        kanaProgress: {
          ...state.kanaProgress,
          [id]: {
            completed_strokes: [],
            completed: false,
          },
        },
      }));
    }
    setCurrentStroke(0);
    setCurrentDrawnStroke(null);
    canvasRef.current?.clear();
    showTemporaryHint("Đã reset bài học, hãy bắt đầu lại!");
  };

  const handleStrokeComplete = async (userImageData, templateSvg) => {
    if (isProcessing || autoResetPending) return;
    setIsProcessing(true);

    try {
      const isCorrect = await compareImages(userImageData, templateSvg);
      canvasRef.current?.clear();

      const currentProgress = progress?.completed_strokes || [];
      let newCompletedStrokes = [...currentProgress];

      if (isCorrect) {
        if (!currentProgress.includes(currentStroke)) {
          newCompletedStrokes = [...currentProgress, currentStroke];
        }
      }

      const isNowCompleted = newCompletedStrokes.length === totalStrokes;

      // Cập nhật store tương ứng
      if (isKanji) {
        useKanjiStore.setState((state) => ({
          kanjiProgress: {
            ...state.kanjiProgress,
            [id]: {
              completed_strokes: newCompletedStrokes,
              completed: isNowCompleted,
            },
          },
        }));
      } else {
        useKanaStore.setState((state) => ({
          kanaProgress: {
            ...state.kanaProgress,
            [id]: {
              completed_strokes: newCompletedStrokes,
              completed: isNowCompleted,
            },
          },
        }));
      }

      if (isCorrect) {
        setCurrentDrawnStroke(currentStroke);
      }

      if (isCorrect && !isNowCompleted) {
        setCurrentStroke((prev) => prev + 1);
        setCurrentDrawnStroke(null);
      }

      if (isNowCompleted) {
        setAutoResetPending(true);
        showTemporaryHint(
          `🎉 Hoàn thành ${character.character}! Tự động reset sau 2 giây.`
        );
        if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = setTimeout(() => {
          handleResetLesson();
          setAutoResetPending(false);
          resetTimeoutRef.current = null;
        }, 2000);
      }
    } catch (err) {
      console.error("Lỗi so sánh nét vẽ:", err);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setMessage(null), 800);
    }
  };

  const playAudio = () => {
    if (character?.audio_url) {
      const audio = new Audio(character.audio_url);
      audio.play().catch((err) => {
        console.error("Không thể phát âm thanh:", err);
        showTemporaryHint("Không thể phát âm thanh, hãy thử lại sau.");
      });
    } else {
      showTemporaryHint("Chưa có file âm thanh cho chữ này.");
    }
  };

  const handleReset = () => {
    canvasRef.current?.clear();
    setCurrentDrawnStroke(null);
    showTemporaryHint("Đã xóa nét hiện tại, bạn có thể vẽ lại.");
  };

  const toggleShowGuide = () => {
    const newState = !showGuide;
    setShowGuide(newState);
    showTemporaryHint(
      newState
        ? "Đã bật hướng dẫn nét vẽ"
        : "Đã tắt hướng dẫn, hãy vẽ theo trí nhớ!"
    );
  };

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
      if (window._hintTimeout) clearTimeout(window._hintTimeout);
    };
  }, []);

  if (storeLoading && !character) {
    return (
      <div className="min-h-screen bg-[#FAF9F8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85A4F] mx-auto"></div>
          <p className="mt-4 text-[#8E8D8A]">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }
  if (!character) return null;

  const characterDisplay = character.character || "";
  const subInfo = isKanji
    ? `${character.meaning || ""}${character.onyomi ? ` · ${character.onyomi}` : ""}${character.kunyomi ? ` · ${character.kunyomi}` : ""}`
    : character.romanji || "";
  const bgSvg = character.svg_content;

  return (
    <div className="min-h-screen bg-[#FAF9F8] font-sans pb-28">
      <style>{`
        @keyframes draw {
          from { stroke-dashoffset: 12000; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes bounce-custom {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-10px); }
        }
        .animate-bounce-custom {
          animation: bounce-custom 0.5s ease-in-out;
        }
      `}</style>

      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-4 max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-[#474747]" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-[#474747]">
              {characterDisplay}
            </h1>
            <p className="text-xs text-[#E85A4F] font-bold uppercase tracking-wider">
              {subInfo || (isKanji ? "Kanji" : "Kana")}
            </p>
          </div>
        </div>
      </header>

      <main className="px-6 max-w-2xl mx-auto py-6 space-y-6">
        <div className="bg-white rounded-2xl shadow-md border border-[#E0E0E0] p-4 relative">
          <div className="relative w-full aspect-square bg-[#FBFCFE] rounded-xl overflow-hidden">
            <div className="absolute inset-0 pointer-events-none border border-dashed border-gray-200 flex items-center justify-center">
              <div className="w-full h-[1px] border-t border-dashed border-gray-200" />
              <div className="absolute h-full w-[1px] border-l border-dashed border-gray-200" />
            </div>

            {showGuide && !autoResetPending && bgSvg && (
              <div
                className="absolute inset-0 p-10 pointer-events-none"
                dangerouslySetInnerHTML={{
                  __html: bgSvgStyle(bgSvg),
                }}
              />
            )}

            {progress?.completed_strokes?.map((strokeIndex) => (
              <div
                key={`completed-${strokeIndex}`}
                className="absolute inset-0 p-10 pointer-events-none"
                dangerouslySetInnerHTML={{
                  __html: completedStrokeStyle(
                    strokes[strokeIndex]?.svg
                  ),
                }}
              />
            ))}

            {currentDrawnStroke !== null && showGuide && !autoResetPending && (
              <div
                className="absolute inset-0 p-10 pointer-events-none"
                dangerouslySetInnerHTML={{
                  __html: getCurrentDrawnStrokeSvg(
                    strokes[currentDrawnStroke]?.svg
                  ),
                }}
              />
            )}

            {showGuide &&
              !autoResetPending &&
              strokes.length > 0 &&
              strokes[currentStroke] && (
                <div
                  className="absolute inset-0 p-10 pointer-events-none"
                  dangerouslySetInnerHTML={{
                    __html: getHintSvgForStroke(
                      strokes[currentStroke]?.svg
                    ),
                  }}
                />
              )}

            <div className="absolute inset-0 p-10">
              <CustomCanvas
                ref={canvasRef}
                width={500}
                height={500}
                disabled={autoResetPending}
                templateSvg={strokes[currentStroke]?.svg}
                onStrokeComplete={handleStrokeComplete}
              />
            </div>
          </div>

          {message && (
            <div
              className={`absolute -top-4 left-1/2 transform -translate-x-1/2 px-6 py-2 rounded-full font-bold text-white shadow-lg animate-bounce-custom ${
                message.type === "success" ? "bg-green-500" : "bg-red-400"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-[#8E8D8A]">
              <Eye className="w-4 h-4" />
              <span>Hướng dẫn nét</span>
            </div>
            <button
              onClick={toggleShowGuide}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                showGuide
                  ? "bg-[#FEE9E7] text-[#E85A4F]"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {showGuide ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {showGuide ? "Ẩn mẫu" : "Hiện mẫu"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 active:scale-95 transition-transform shadow-sm hover:shadow-md"
            >
              <RotateCcw className="w-5 h-5" />
              Xóa nét
            </button>
            <button
              onClick={playAudio}
              className="flex items-center justify-center gap-2 py-3 bg-linear-to-r from-[#E85A4F] to-[#E98074] rounded-xl font-medium text-white active:scale-95 transition-transform shadow-md hover:shadow-lg"
            >
              <Volume2 className="w-5 h-5" />
              Nghe
            </button>
          </div>

          {dynamicHint && (
            <p className="text-xs text-center text-[#E85A4F] bg-[#FEE9E7] py-2 px-3 rounded-full transition-all duration-300 font-medium">
              {dynamicHint}
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default KanaPracticePage;