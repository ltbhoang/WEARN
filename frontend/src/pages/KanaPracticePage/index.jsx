import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useKanaStore } from "../../store/kanaStore";
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Home,
  RotateCcw,
  Volume2,
} from "lucide-react";

// ========== CUSTOM CANVAS ==========
const CustomCanvas = React.forwardRef(
  ({ width, height, disabled, onStrokeComplete, templateSvg }, ref) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const ctxRef = useRef(null);
    const lastDrawingRef = useRef(false);

    useEffect(() => {
      const canvas = canvasRef.current;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1E293B";
      ctx.lineWidth = 25;
      ctxRef.current = ctx;

      const preventDefault = (e) => {
        if (e.cancelable) e.preventDefault();
      };
      canvas.addEventListener("touchstart", preventDefault, { passive: false });
      canvas.addEventListener("touchmove", preventDefault, { passive: false });
      return () => {
        canvas.removeEventListener("touchstart", preventDefault);
        canvas.removeEventListener("touchmove", preventDefault);
      };
    }, [width, height]);

    const getCoords = (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      let clientX, clientY;
      if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    const startDrawing = (e) => {
      if (disabled) return;
      const { x, y } = getCoords(e);
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(x, y);
      setIsDrawing(true);
      lastDrawingRef.current = false;
    };

    const draw = (e) => {
      if (!isDrawing || disabled) return;
      const { x, y } = getCoords(e);
      ctxRef.current.lineTo(x, y);
      ctxRef.current.stroke();
    };

    const stopDrawing = async () => {
      if (!isDrawing || disabled) return;
      setIsDrawing(false);
      if (templateSvg && !lastDrawingRef.current) {
        lastDrawingRef.current = true;
        const imageData = canvasRef.current.toDataURL();
        if (onStrokeComplete) await onStrokeComplete(imageData, templateSvg);
      }
    };

    React.useImperativeHandle(ref, () => ({
      clear: () => ctxRef.current.clearRect(0, 0, width, height),
    }));

    return (
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full h-full touch-none cursor-crosshair"
      />
    );
  }
);

// ========== SO SÁNH 2 CHIỀU (Precision & Recall) ==========
const compareImages = (
  userImageDataURL,
  templateSvgString,
  threshold = 0.6
) => {
  return new Promise((resolve) => {
    const imgUser = new Image();
    const imgTemplate = new Image();
    let loaded = 0;

    const getProcessedData = (img) => {
      const size = 100;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size).data;
      const binaryMap = new Uint8Array(size * size);
      for (let i = 0; i < imageData.length; i += 4) {
        const brightness =
          (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
        binaryMap[i / 4] = brightness < 250 ? 1 : 0;
      }
      return binaryMap;
    };

    const check = () => {
      loaded++;
      if (loaded === 2) {
        const dataUser = getProcessedData(imgUser);
        const dataTemplate = getProcessedData(imgTemplate);

        let hit = 0;
        let miss = 0;
        let totalTemplate = 0;

        for (let i = 0; i < dataTemplate.length; i++) {
          if (dataTemplate[i] === 1) {
            totalTemplate++;
            if (dataUser[i] === 1) hit++;
          } else {
            if (dataUser[i] === 1) miss++;
          }
        }

        const recall = hit / (totalTemplate || 1);
        const precision = hit / (hit + miss || 1);
        const finalScore = recall * 0.6 + precision * 0.4;
        console.log(
          `Recall: ${recall.toFixed(2)}, Precision: ${precision.toFixed(
            2
          )}, Score: ${finalScore.toFixed(2)}`
        );
        resolve(finalScore >= threshold && recall > 0.5);
      }
    };

    imgUser.onload = check;
    imgTemplate.onload = check;
    imgUser.src = userImageDataURL;
    const blob = new Blob([templateSvgString], { type: "image/svg+xml" });
    imgTemplate.src = URL.createObjectURL(blob);
  });
};

// ========== MAIN COMPONENT ==========
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
  const [showGuide, setShowGuide] = useState(true);
  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef(null);

  const playSound = (type) => {
    if (type === "success") {
      const audio = new Audio("/sounds/success.mp3");
      audio.play().catch(() => {});
    }
  };

  useEffect(() => {
    if (kanaId) {
      fetchKanaDetail(kanaId);
      getKanaProgress(kanaId);
    }
  }, [kanaId, fetchKanaDetail, getKanaProgress]);

  useEffect(() => {
    const progress = kanaProgress[kanaId];
    if (progress) setCurrentStroke(progress.completed_strokes.length);
  }, [kanaProgress, kanaId]);

  // Helper styles
  const removeStyleAndAnimation = (svgString) => {
    let cleaned = svgString.replace(/<style>[\s\S]*?<\/style>/g, "");
    cleaned = cleaned.replace(/\s*animation:[^;]*;?/g, "");
    cleaned = cleaned.replace(/\s*stroke-dasharray:[^;]*;?/g, "");
    cleaned = cleaned.replace(/\s*stroke-dashoffset:[^;]*;?/g, "");
    return cleaned;
  };

  const completedStrokeStyle = (svgString) => {
    if (!svgString) return "";
    let cleaned = removeStyleAndAnimation(svgString);
    return cleaned
      .replace(/stroke="[^"]*"/g, 'stroke="#22C55E"')
      .replace(/stroke-width="[^"]*"/g, 'stroke-width="35"')
      .replace(/fill="[^"]*"/g, 'fill="none"');
  };

  const hintStrokeStyle = (svgString) => {
    if (!svgString) return "";
    let cleaned = svgString.replace(/<style>[\s\S]*?<\/style>/g, "");
    return cleaned
      .replace(/stroke="[^"]*"/g, 'stroke="#3B82F6"')
      .replace(/stroke-width="[^"]*"/g, 'stroke-width="35"')
      .replace(/fill="[^"]*"/g, 'fill="none"')
      .replace(/<svg/g, '<svg class="drawing-animation" style="opacity:0.4"');
  };

  const bgSvgStyle = (svgString) => {
    if (!svgString) return "";
    let cleaned = removeStyleAndAnimation(svgString);
    return cleaned
      .replace(/stroke="[^"]*"/g, 'stroke="#E2E8F0"')
      .replace(/stroke-width="[^"]*"/g, 'stroke-width="30"')
      .replace(/fill="[^"]*"/g, 'fill="none"')
      .replace(/<svg/g, '<svg style="opacity:0.5"');
  };

  const handleStrokeComplete = async (userImageData, templateSvg) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const isCorrect = await compareImages(userImageData, templateSvg, 0.6);
      if (isCorrect) {
        playSound("success");
        setMessage({ type: "success", text: "Tuyệt vời!" });
        canvasRef.current?.clear();

        const newCompletedStrokes = [
          ...(kanaProgress[kanaId]?.completed_strokes || []),
          currentStroke,
        ];
        const newCompleted = newCompletedStrokes.length === kana.strokes.length;
        useKanaStore.setState((state) => ({
          kanaProgress: {
            ...state.kanaProgress,
            [kanaId]: {
              completed_strokes: newCompletedStrokes,
              completed: newCompleted,
            },
          },
        }));

        const nextStrokeIndex = currentStroke + 1;
        if (nextStrokeIndex < kana.strokes.length) {
          setCurrentStroke(nextStrokeIndex);
        } else {
          setMessage({ type: "success", text: "🎉 Hoàn thành chữ!" });
          setTimeout(() => navigate("/kana-lessons"), 1500);
          return;
        }
        setTimeout(() => setMessage(null), 1000);
      } else {
        setMessage({ type: "error", text: "Thử lại nhé!" });
        setTimeout(() => setMessage(null), 1000);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Lỗi, thử lại" });
      setTimeout(() => setMessage(null), 1000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => canvasRef.current?.clear();

  if (storeLoading && !kana) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#E85A4F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8E8D8A]">Đang tải bài học...</p>
        </div>
      </div>
    );
  }
  if (!kana) return null;

  const progress = kanaProgress[kanaId];
  const isCompleted = progress?.completed;
  const currentStrokeData = kana.strokes?.[currentStroke];

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans pb-28">
      <style>{`
        @keyframes draw {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }
        .drawing-animation path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw 2s ease-in-out infinite alternate;
        }
        @keyframes bounce-custom {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-10px); }
        }
        .animate-bounce-custom {
          animation: bounce-custom 0.5s ease-in-out;
        }
      `}</style>

      {/* Header */}
      <div className="bg-[#FEE9E7] px-6 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#4A4A4A] shadow-md"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-[#2D2D2D]">
                {kana.character}
              </h1>
              <p className="text-xs text-[#E85A4F] font-bold uppercase tracking-wider">
                {kana.romanji}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#4A4A4A] shadow-md"
          >
            <Home className="w-6 h-6" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#8E8D8A]">Tiến độ nét</span>
            <span className="font-medium text-[#E85A4F]">
              {currentStroke} / {kana.strokes.length}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E85A4F] rounded-full transition-all duration-500"
              style={{
                width: `${(currentStroke / kana.strokes.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Khu vực vẽ */}
      <div className="px-6 mt-6">
        <div className="bg-white rounded-3xl shadow-lg p-4 relative">
          <div className="relative w-full aspect-square bg-[#FBFCFE] rounded-2xl overflow-hidden border-2 border-gray-100">
            {/* Grid lines */}
            <div className="absolute inset-0 pointer-events-none border border-dashed border-gray-200 flex items-center justify-center">
              <div className="w-full h-[1px] border-t border-dashed border-gray-200" />
              <div className="absolute h-full w-[1px] border-l border-dashed border-gray-200" />
            </div>

            {/* SVG nền mờ */}
            {showGuide && !isCompleted && kana.svg_content && (
              <div
                className="absolute inset-0 p-6 pointer-events-none"
                dangerouslySetInnerHTML={{
                  __html: bgSvgStyle(kana.svg_content),
                }}
              />
            )}

            {/* Nét đã hoàn thành */}
            {progress?.completed_strokes?.map((idx) => (
              <div
                key={idx}
                className="absolute inset-0 p-6 pointer-events-none"
                dangerouslySetInnerHTML={{
                  __html: completedStrokeStyle(kana.strokes[idx]?.svg),
                }}
              />
            ))}

            {/* Nét đang học */}
            {showGuide && !isCompleted && currentStrokeData && (
              <div
                className="absolute inset-0 p-6 pointer-events-none"
                dangerouslySetInnerHTML={{
                  __html: hintStrokeStyle(currentStrokeData.svg),
                }}
              />
            )}

            {/* Canvas vẽ */}
            <div className="absolute inset-0 p-6">
              <CustomCanvas
                ref={canvasRef}
                width={500}
                height={500}
                disabled={isCompleted}
                templateSvg={currentStrokeData?.svg}
                onStrokeComplete={handleStrokeComplete}
              />
            </div>
          </div>

          {/* Thông báo nổi */}
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
      </div>

      {/* Điều khiển */}
      <div className="px-6 mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-[#8E8D8A]">
            <Eye className="w-4 h-4" />
            <span>Hướng dẫn nét</span>
          </div>
          <button
            onClick={() => setShowGuide(!showGuide)}
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
            className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 active:scale-95 transition-transform shadow-sm"
          >
            <RotateCcw className="w-5 h-5" />
            Xóa nét
          </button>
          <button
            onClick={() => {
              // TODO: phát âm thanh đọc chữ
            }}
            className="flex items-center justify-center gap-2 py-3 bg-[#E85A4F] rounded-xl font-medium text-white active:scale-95 transition-transform shadow-md"
          >
            <Volume2 className="w-5 h-5" />
            Nghe
          </button>
        </div>

        <p className="text-xs text-center text-[#8E8D8A] mt-2">
          Vẽ đè lên nét mẫu, khi đủ giống sẽ tự động hoàn thành
        </p>
      </div>
    </div>
  );
};

export default KanaPracticePage;
