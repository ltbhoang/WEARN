// KanaPracticePage.jsx
import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useKanaStore } from "../../store/kanaStore";
import { ChevronLeft, Eye, EyeOff, RotateCcw, Volume2 } from "lucide-react";
import CustomCanvas from "../../components/Canvas";
import compareImages from "../../utils/compareImages";

const KanaPracticePage = () => {
  const { kanaId } = useParams();
  const navigate = useNavigate();
  const {
    currentKana: kana,
    fetchKanaDetail,
    kanaProgress,
    getKanaProgress,
    loading: storeLoading,
  } = useKanaStore();

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
    if (kanaId) {
      fetchKanaDetail(kanaId);
      getKanaProgress(kanaId);
    }
  }, [kanaId, fetchKanaDetail, getKanaProgress]);

  useEffect(() => {
    const progress = kanaProgress[kanaId];
    if (progress && kana?.strokes) {
      const completedCount = progress.completed_strokes.length;
      if (
        completedCount !== currentStroke &&
        completedCount <= kana.strokes.length
      ) {
        setCurrentStroke(completedCount);
        setCurrentDrawnStroke(null);
      }
    }
  }, [kanaProgress, kanaId, kana?.strokes, currentStroke]);

  const removeStyleAndAnimation = (svgString) => {
    let cleaned = svgString.replace(/<style>[\s\S]*?<\/style>/g, "");
    cleaned = cleaned.replace(/\s*animation:[^;]*;?/g, "");
    cleaned = cleaned.replace(/\s*stroke-dasharray:[^;]*;?/g, "");
    cleaned = cleaned.replace(/\s*stroke-dashoffset:[^;]*;?/g, "");
    return cleaned;
  };

  const completedStrokeStyle = (fullSvg, strokeIndex) => {
    if (!fullSvg) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(fullSvg, "image/svg+xml");
    const svg = doc.documentElement;
    const strokePaths = Array.from(svg.querySelectorAll("path[clip-path]"));
    if (strokeIndex >= strokePaths.length) return "";
    const targetStroke = strokePaths[strokeIndex];
    const newSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    newSvg.setAttribute("viewBox", "0 0 1024 1024");
    newSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    newSvg.setAttribute("width", "100%");
    newSvg.setAttribute("height", "100%");
    newSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const clipPathAttr = targetStroke.getAttribute("clip-path");
    if (clipPathAttr) {
      const clipPathId = clipPathAttr.replace("url(#", "").replace(")", "");
      const targetClipPath = svg.querySelector(`#${clipPathId}`);
      if (targetClipPath) defs.appendChild(targetClipPath.cloneNode(true));
    }
    const useHref =
      targetStroke.querySelector("use")?.getAttribute("href") ||
      (clipPathAttr
        ? svg
            .querySelector(`#${clipPathAttr.replace(/url\(#|\)/g, "")}`)
            ?.querySelector("use")
            ?.getAttribute("href")
        : null);
    if (useHref) {
      const outlineId = useHref.replace("#", "");
      const targetOutline = svg.querySelector(`#${outlineId}`);
      if (targetOutline) defs.appendChild(targetOutline.cloneNode(true));
    }
    newSvg.appendChild(defs);
    const completedPath = targetStroke.cloneNode(true);
    completedPath.removeAttribute("style");
    completedPath.removeAttribute("fill");
    completedPath.removeAttribute("stroke-dasharray");
    completedPath.removeAttribute("stroke-dashoffset");
    completedPath.setAttribute("fill", "none");
    completedPath.setAttribute("stroke", "#10B981");
    completedPath.setAttribute("stroke-width", "72");
    completedPath.setAttribute("stroke-linecap", "round");
    completedPath.setAttribute("stroke-linejoin", "round");
    newSvg.appendChild(completedPath);
    return newSvg.outerHTML;
  };

  const getCurrentDrawnStrokeSvg = (fullSvg, strokeIndex) => {
    if (!fullSvg) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(fullSvg, "image/svg+xml");
    const svg = doc.documentElement;
    const strokePaths = Array.from(svg.querySelectorAll("path[clip-path]"));
    if (strokeIndex >= strokePaths.length) return "";
    const targetStroke = strokePaths[strokeIndex];
    const newSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    newSvg.setAttribute("viewBox", "0 0 1024 1024");
    newSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    newSvg.setAttribute("width", "100%");
    newSvg.setAttribute("height", "100%");
    newSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const clipPathAttr = targetStroke.getAttribute("clip-path");
    if (clipPathAttr) {
      const clipPathId = clipPathAttr.replace("url(#", "").replace(")", "");
      const targetClipPath = svg.querySelector(`#${clipPathId}`);
      if (targetClipPath) defs.appendChild(targetClipPath.cloneNode(true));
    }
    const useHref =
      targetStroke.querySelector("use")?.getAttribute("href") ||
      (clipPathAttr
        ? svg
            .querySelector(`#${clipPathAttr.replace(/url\(#|\)/g, "")}`)
            ?.querySelector("use")
            ?.getAttribute("href")
        : null);
    if (useHref) {
      const outlineId = useHref.replace("#", "");
      const targetOutline = svg.querySelector(`#${outlineId}`);
      if (targetOutline) defs.appendChild(targetOutline.cloneNode(true));
    }
    newSvg.appendChild(defs);
    const drawnPath = targetStroke.cloneNode(true);
    drawnPath.removeAttribute("style");
    drawnPath.removeAttribute("fill");
    drawnPath.removeAttribute("stroke-dasharray");
    drawnPath.removeAttribute("stroke-dashoffset");
    drawnPath.setAttribute("fill", "none");
    drawnPath.setAttribute("stroke", "#10B981");
    drawnPath.setAttribute("stroke-width", "72");
    drawnPath.setAttribute("stroke-linecap", "round");
    drawnPath.setAttribute("stroke-linejoin", "round");
    newSvg.appendChild(drawnPath);
    return newSvg.outerHTML;
  };

  const getHintSvgForStroke = (fullSvg, strokeIndex) => {
    if (!fullSvg) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(fullSvg, "image/svg+xml");
    const svg = doc.documentElement;
    const strokePaths = Array.from(svg.querySelectorAll("path[clip-path]"));
    if (strokeIndex >= strokePaths.length) return "";
    const targetStroke = strokePaths[strokeIndex];
    const clipPathAttr = targetStroke.getAttribute("clip-path");
    if (!clipPathAttr) return "";
    const clipPathId = clipPathAttr.replace("url(#", "").replace(")", "");
    const targetClipPath = svg.querySelector(`#${clipPathId}`);
    const useHref = targetClipPath?.querySelector("use")?.getAttribute("href");
    const outlineId = useHref ? useHref.replace("#", "") : null;
    const targetOutline = outlineId ? svg.querySelector(`#${outlineId}`) : null;
    const newSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    newSvg.setAttribute("viewBox", "0 0 1024 1024");
    newSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    if (targetClipPath) defs.appendChild(targetClipPath.cloneNode(true));
    if (targetOutline) defs.appendChild(targetOutline.cloneNode(true));
    newSvg.appendChild(defs);
    const newStroke = targetStroke.cloneNode(true);
    newStroke.removeAttribute("style");
    newStroke.removeAttribute("fill");
    newStroke.setAttribute("fill", "none");
    newStroke.setAttribute("stroke", "#3B82F6");
    newStroke.setAttribute("stroke-width", "138");
    newStroke.setAttribute("stroke-linecap", "round");
    newStroke.setAttribute("stroke-linejoin", "round");
    newStroke.setAttribute("stroke-dasharray", "12000");
    newStroke.setAttribute("stroke-dashoffset", "12000");
    newStroke.style.animation = "draw 3s linear infinite";
    newSvg.appendChild(newStroke);
    const style = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "style"
    );
    style.textContent = `@keyframes draw { from { stroke-dashoffset: 12000; } to { stroke-dashoffset: 0; } }`;
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
    useKanaStore.setState((state) => ({
      kanaProgress: {
        ...state.kanaProgress,
        [kanaId]: {
          completed_strokes: [],
          completed: false,
        },
      },
    }));
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

      const currentProgress = kanaProgress[kanaId]?.completed_strokes || [];
      let newCompletedStrokes = [...currentProgress];

      if (isCorrect) {
        if (!currentProgress.includes(currentStroke)) {
          newCompletedStrokes = [...currentProgress, currentStroke];
        }
      } else {
        // Không làm gì hoặc có thể thêm logic khác nếu cần
      }

      const isNowCompleted = newCompletedStrokes.length === kana.strokes.length;

      useKanaStore.setState((state) => ({
        kanaProgress: {
          ...state.kanaProgress,
          [kanaId]: {
            completed_strokes: newCompletedStrokes,
            completed: isNowCompleted,
          },
        },
      }));

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
          `🎉 Hoàn thành chữ ${kana.character}! Tự động reset sau 2 giây.`
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
    if (kana?.audio_url) {
      const audio = new Audio(kana.audio_url);
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

  if (storeLoading && !kana) {
    return (
      <div className="min-h-screen bg-[#FAF9F8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85A4F] mx-auto"></div>
          <p className="mt-4 text-[#8E8D8A]">Đang tải bài học...</p>
        </div>
      </div>
    );
  }
  if (!kana) return null;

  const progress = kanaProgress[kanaId];
  const currentStrokeData = kana.strokes?.[currentStroke];

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
              {kana.character}
            </h1>
            <p className="text-xs text-[#E85A4F] font-bold uppercase tracking-wider">
              {kana.romanji}
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

            {showGuide && !autoResetPending && kana.svg_content && (
              <div
                className="absolute inset-0 p-10 pointer-events-none"
                dangerouslySetInnerHTML={{
                  __html: bgSvgStyle(kana.svg_content),
                }}
              />
            )}

            {progress?.completed_strokes?.map((strokeIndex) => (
              <div
                key={`completed-${strokeIndex}`}
                className="absolute inset-0 p-10 pointer-events-none"
                dangerouslySetInnerHTML={{
                  __html: completedStrokeStyle(kana.svg_content, strokeIndex),
                }}
              />
            ))}

            {currentDrawnStroke !== null && showGuide && !autoResetPending && (
              <div
                className="absolute inset-0 p-10 pointer-events-none"
                dangerouslySetInnerHTML={{
                  __html: getCurrentDrawnStrokeSvg(
                    kana.svg_content,
                    currentDrawnStroke
                  ),
                }}
              />
            )}

            {showGuide &&
              !autoResetPending &&
              kana.svg_content &&
              currentStrokeData && (
                <div
                  className="absolute inset-0 p-10 pointer-events-none"
                  dangerouslySetInnerHTML={{
                    __html: getHintSvgForStroke(
                      kana.svg_content,
                      currentStroke
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
                templateSvg={currentStrokeData?.svg}
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
              onClick={playAudio} // Gắn hàm playAudio vào đây
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
