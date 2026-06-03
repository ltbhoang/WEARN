// KanaTestPage.jsx - ĐÃ SỬA THEO YÊU CẦU

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useKanaStore } from "../../store/kanaStore";
import { ChevronLeft, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";

// ================== CUSTOM CANVAS (giữ nguyên) ==================
const CustomCanvas = React.forwardRef(
  ({ width, height, disabled, onStrokeComplete, templateSvg }, ref) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const ctxRef = useRef(null);
    const lastDrawingRef = useRef(false);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1E293B";
      ctx.lineWidth = 30;
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
      clear: () => {
        if (ctxRef.current) ctxRef.current.clearRect(0, 0, width, height);
      },
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

// ================== HÀM SO SÁNH NÉT VẼ & XỬ LÝ SVG (giữ nguyên) ==================
const compareImages = (userImageDataURL, templateSvgString) => {
  return new Promise((resolve) => {
    const imgUser = new Image();
    const imgTemplate = new Image();
    let loaded = 0;

    const getBinaryMap = (img, isTemplate = false) => {
      const size = 100;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (isTemplate) {
        ctx.lineWidth = 25;
        ctx.strokeStyle = "black";
        ctx.lineCap = "round";
      }
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      const binary = new Uint8Array(size * size);
      for (let i = 0; i < data.length; i += 4) {
        binary[i / 4] = data[i + 3] > 20 ? 1 : 0;
      }
      return binary;
    };

    const computeDistanceMap = (binaryMap, size) => {
      const dist = new Float32Array(size * size).fill(Infinity);
      const queue = [];
      for (let i = 0; i < binaryMap.length; i++) {
        if (binaryMap[i] === 1) {
          dist[i] = 0;
          queue.push(i);
        }
      }
      const dirs = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ];
      while (queue.length) {
        const idx = queue.shift();
        const x = idx % size;
        const y = Math.floor(idx / size);
        const cur = dist[idx];
        for (const [dx, dy] of dirs) {
          const nx = x + dx,
            ny = y + dy;
          if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
            const nidx = ny * size + nx;
            const nd = cur + Math.sqrt(dx * dx + dy * dy);
            if (nd < dist[nidx]) {
              dist[nidx] = nd;
              queue.push(nidx);
            }
          }
        }
      }
      return dist;
    };

    const check = () => {
      loaded++;
      if (loaded === 2) {
        const userMap = getBinaryMap(imgUser);
        const templateMap = getBinaryMap(imgTemplate, true);
        const size = 100;

        let totalUserPixels = 0;
        for (let i = 0; i < userMap.length; i++) {
          if (userMap[i] === 1) totalUserPixels++;
        }
        if (totalUserPixels < 50) {
          resolve(false);
          return;
        }

        const distUserToTemplate = computeDistanceMap(templateMap, size);
        let totalUser = 0,
          goodUser = 0;
        for (let i = 0; i < userMap.length; i++) {
          if (userMap[i] === 1) {
            totalUser++;
            if (distUserToTemplate[i] <= 8) goodUser++;
          }
        }

        const distTemplateToUser = computeDistanceMap(userMap, size);
        let totalTemplate = 0,
          coveredTemplate = 0;
        for (let i = 0; i < templateMap.length; i++) {
          if (templateMap[i] === 1) {
            totalTemplate++;
            if (distTemplateToUser[i] <= 8) coveredTemplate++;
          }
        }

        const accuracy = goodUser / (totalUser || 1);
        const coverage = coveredTemplate / (totalTemplate || 1);
        resolve(accuracy > 0.7 && coverage > 0.6);
      }
    };

    imgUser.onload = check;
    imgTemplate.onload = check;
    imgUser.src = userImageDataURL;
    const blob = new Blob([templateSvgString], { type: "image/svg+xml" });
    imgTemplate.src = URL.createObjectURL(blob);
  });
};

const removeStyleAndAnimation = (svgString) => {
  if (!svgString) return "";
  let cleaned = svgString.replace(/<style>[\s\S]*?<\/style>/g, "");
  cleaned = cleaned.replace(/\s*animation:[^;]*;?/g, "");
  cleaned = cleaned.replace(/\s*stroke-dasharray:[^;]*;?/g, "");
  cleaned = cleaned.replace(/\s*stroke-dashoffset:[^;]*;?/g, "");
  return cleaned;
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

const getHintSvgForStroke = (fullSvg, strokeIndex) => {
  if (!fullSvg) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(fullSvg, "image/svg+xml");
  const svg = doc.documentElement;
  const strokePaths = Array.from(svg.querySelectorAll("path[clip-path]"));
  if (strokeIndex >= strokePaths.length) return "";

  const targetStroke = strokePaths[strokeIndex];
  const newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  newSvg.setAttribute("viewBox", "0 0 1024 1024");
  newSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

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

  const newStroke = targetStroke.cloneNode(true);
  newStroke.removeAttribute("style");
  newStroke.setAttribute("fill", "none");
  newStroke.setAttribute("stroke", "#3B82F6");
  newStroke.setAttribute("stroke-width", "138");
  newStroke.setAttribute("stroke-linecap", "round");
  newStroke.setAttribute("stroke-linejoin", "round");
  newStroke.setAttribute("stroke-dasharray", "12000");
  newStroke.setAttribute("stroke-dashoffset", "12000");
  newStroke.style.animation = "draw 2.5s linear infinite";

  newSvg.appendChild(newStroke);

  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = `@keyframes draw { from { stroke-dashoffset: 12000; } to { stroke-dashoffset: 0; } }`;
  newSvg.appendChild(style);

  return newSvg.outerHTML;
};

const completedStrokeStyle = (fullSvg, strokeIndex) => {
  if (!fullSvg) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(fullSvg, "image/svg+xml");
  const svg = doc.documentElement;
  const strokePaths = Array.from(svg.querySelectorAll("path[clip-path]"));
  if (strokeIndex >= strokePaths.length) return "";

  const targetStroke = strokePaths[strokeIndex];
  const newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
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

// ================== MAIN COMPONENT ==================
const KanaTestPage = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const {
    lessons,
    fetchLessons,
    completeLesson,
    fetchKanaDetail,
    currentKana: kana,
    loading: storeLoading,
  } = useKanaStore();

  const [lesson, setLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [dynamicHint, setDynamicHint] = useState("");
  const [writingStrokeProgress, setWritingStrokeProgress] = useState({});

  const canvasRef = useRef(null);
  const resetTimeoutRef = useRef(null);

  // Load lesson
  useEffect(() => {
    const load = async () => {
      if (lessons.length === 0) await fetchLessons();
      const found = lessons.find((l) => String(l.id) === lessonId);
      if (found) setLesson(found);
    };
    load();
  }, [lessonId, lessons, fetchLessons]);

  // Tạo câu hỏi CHỈ MỘT LẦN khi có lesson
  useEffect(() => {
    if (lesson?.kanas?.length > 0 && questions.length === 0) {
      generateQuestions(lesson.kanas);
    }
  }, [lesson]);

  // Hàm tạo câu hỏi: mỗi chữ xuất hiện 2 lần với 2 dạng khác nhau, đảm bảo không trùng
  const generateQuestions = (kanas) => {
    const totalQuestions = 10;
    if (!kanas || kanas.length === 0) return;

    // 1. Tạo danh sách 10 câu, mỗi chữ 2 lần (nếu có 5 chữ)
    let selectedKanas = [];
    while (selectedKanas.length < totalQuestions) {
      for (let k of kanas) {
        if (selectedKanas.length < totalQuestions) selectedKanas.push(k);
      }
    }

    // 2. Xáo trộn danh sách
    for (let i = selectedKanas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selectedKanas[i], selectedKanas[j]] = [
        selectedKanas[j],
        selectedKanas[i],
      ];
    }

    // 3. Gán loại câu hỏi cho mỗi kana, đảm bảo không trùng lặp loại cho cùng một chữ
    // Tạo map đếm số lần xuất hiện và loại đã dùng cho mỗi chữ
    const kanaUsage = new Map(); // key: kana.id, value: { count, usedTypes: Set }
    for (let k of kanas) {
      kanaUsage.set(k.id, { count: 0, usedTypes: new Set() });
    }

    const newQuestions = selectedKanas.map((kanaItem) => {
      const usage = kanaUsage.get(kanaItem.id);
      usage.count++;

      // Xác định loại câu hỏi
      let type = null;
      let subType = null;

      // Nếu đã dùng writing rồi thì chỉ dùng multiple
      if (usage.usedTypes.has("writing")) {
        type = "multiple";
        subType = Math.random() < 0.5 ? "chooseRomaji" : "chooseKana";
      }
      // Nếu đã dùng cả hai loại multiple (chooseRomaji và chooseKana) thì ưu tiên writing hoặc random
      else if (
        usage.usedTypes.has("chooseRomaji") &&
        usage.usedTypes.has("chooseKana")
      ) {
        type = "writing";
      } else {
        // Ưu tiên xen kẽ: nếu count lẻ -> writing, chẵn -> multiple (hoặc ngược lại)
        const preferWriting = usage.count % 2 === 1; // lần xuất hiện đầu tiên (count=1) ưu tiên writing
        if (preferWriting && !usage.usedTypes.has("writing")) {
          type = "writing";
        } else {
          type = "multiple";
          // Chọn subtype chưa dùng nếu có thể
          if (!usage.usedTypes.has("chooseRomaji")) subType = "chooseRomaji";
          else if (!usage.usedTypes.has("chooseKana")) subType = "chooseKana";
          else subType = Math.random() < 0.5 ? "chooseRomaji" : "chooseKana";
        }
      }

      // Lưu lại loại đã dùng
      if (type === "writing") usage.usedTypes.add("writing");
      else if (subType) usage.usedTypes.add(subType);

      // Tạo câu hỏi
      if (type === "writing") {
        return {
          id: kanaItem.id,
          type: "writing",
          question: `Hãy viết chữ "${kanaItem.romanji}" vào khung bên dưới.`,
          kana: kanaItem,
          totalStrokes: kanaItem.total_strokes || kanaItem.strokes?.length || 1,
        };
      } else {
        if (subType === "chooseRomaji") {
          const correct = kanaItem.romanji;
          const options = getRandomWrongOptions(correct, kanas, "romanji", 3);
          return {
            id: kanaItem.id,
            type: "multiple",
            subType: "chooseRomaji",
            question: `Chữ "${kanaItem.character}" đọc là gì?`,
            display: kanaItem.character,
            correctAnswer: correct,
            options: [correct, ...options].sort(() => Math.random() - 0.5),
            kana: kanaItem,
          };
        } else {
          const correct = kanaItem.character;
          const options = getRandomWrongOptions(correct, kanas, "character", 3);
          return {
            id: kanaItem.id,
            type: "multiple",
            subType: "chooseKana",
            question: `Âm "${kanaItem.romanji}" viết bằng chữ gì?`,
            display: kanaItem.romanji,
            correctAnswer: correct,
            options: [correct, ...options].sort(() => Math.random() - 0.5),
            kana: kanaItem,
          };
        }
      }
    });

    setQuestions(newQuestions);
    setCurrentIndex(0);
    setScore(0);
    setFinalScore(0);
    setShowResult(false);
    setWritingStrokeProgress({});
  };

  const getRandomWrongOptions = (correct, kanas, field, count = 3) => {
    // 1. Lấy tất cả các chữ khác trong lesson hiện tại
    const others = kanas
      .filter((k) => k[field] !== correct)
      .map((k) => k[field]);
    let result = [...new Set(others)]; // Dùng Set để đảm bảo không trùng

    // 2. Nếu vẫn thiếu option (do lesson quá ít chữ), lấy thêm từ tất cả lessons
    if (result.length < count) {
      const allPossibleKanas = lessons.flatMap((l) => l.kanas || []);
      const backupOptions = allPossibleKanas
        .filter((k) => k[field] !== correct && !result.includes(k[field]))
        .map((k) => k[field]);

      // Trộn ngẫu nhiên danh sách dự phòng và lấy số lượng còn thiếu
      const additional = backupOptions.sort(() => Math.random() - 0.5);
      while (result.length < count && additional.length > 0) {
        result.push(additional.pop());
      }
    }

    // 3. Trả về kết quả (cắt đúng số lượng yêu cầu)
    return result.sort(() => Math.random() - 0.5).slice(0, count);
  };

  // Fetch kana detail khi chuyển sang câu viết
  useEffect(() => {
    const currentQ = questions[currentIndex];
    if (currentQ?.type === "writing" && currentQ.kana?.id) {
      fetchKanaDetail(currentQ.kana.id);
    }
  }, [currentIndex, questions, fetchKanaDetail]);

  const showTemporaryHint = (text) => {
    setDynamicHint(text);
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(() => setDynamicHint(""), 1800);
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

  const handleStrokeComplete = async (userImageData, templateSvg) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const isCorrect = await compareImages(userImageData, templateSvg);
      const currentQ = questions[currentIndex];
      const currentDone = writingStrokeProgress[currentIndex] || 0;
      const newDone = currentDone + 1;

      if (isCorrect) {
        setWritingStrokeProgress((prev) => ({
          ...prev,
          [currentIndex]: newDone,
        }));
        canvasRef.current?.clear();

        if (newDone === currentQ.totalStrokes) {
          setScore((prev) => prev + 1);

          setTimeout(() => {
            if (currentIndex + 1 < questions.length) {
              setCurrentIndex((prev) => prev + 1);
            } else {
              finishTest();
            }
          }, 1200);
        }
      } else {
        showTemporaryHint("✏️ Nét vẽ chưa chính xác!");
        canvasRef.current?.clear();
      }
    } catch (err) {
      console.error("Lỗi so sánh nét:", err);
      showTemporaryHint("Lỗi xử lý, hãy thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  const finishTest = () => {
    let calculatedScore = score;
    const currentQ = questions[currentIndex];

    if (currentQ?.type === "writing") {
      const strokesDone = writingStrokeProgress[currentIndex] || 0;
      if (strokesDone === currentQ.totalStrokes) {
        calculatedScore += 1;
      }
    }

    setFinalScore(calculatedScore);
    setShowResult(true);

    if (calculatedScore >= 7 && lesson) {
      completeLesson(lesson.id);
    }
  };

  const restartTest = () => {
    if (lesson) generateQuestions(lesson.kanas);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  // ================== RENDER ==================
  if (storeLoading || !lesson) {
    return (
      <div className="min-h-screen bg-[#FAF9F8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85A4F]"></div>
      </div>
    );
  }

  if (showResult) {
    const passed = finalScore >= 7;
    return (
      <div className="min-h-screen bg-[#FAF9F8] flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          {passed ? (
            <>
              <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h2 className="text-3xl font-black text-[#474747] mb-2">
                Chúc mừng!
              </h2>
              <p className="text-xl text-green-600 font-semibold mb-1">
                Bạn đã hoàn thành bài kiểm tra
              </p>
              <p className="text-[#8E8D8A] mb-6">
                Điểm số:{" "}
                <span className="font-bold text-3xl text-[#474747]">
                  {finalScore}/{questions.length}
                </span>
              </p>
              <button
                onClick={() => navigate(`/kana-lesson/${lessonId}`)}
                className="w-full bg-[#E85A4F] hover:bg-[#d94a3f] text-white font-bold py-4 rounded-2xl text-lg transition-all active:scale-95"
              >
                Về bài học
              </button>
            </>
          ) : (
            <>
              <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <XCircle className="w-16 h-16 text-red-500" />
              </div>
              <h2 className="text-3xl font-black text-[#474747] mb-2">
                Chưa đạt yêu cầu
              </h2>
              <p className="text-[#8E8D8A] mb-2">
                Điểm số của bạn:{" "}
                <span className="font-bold text-3xl">
                  {finalScore}/{questions.length}
                </span>
              </p>
              <p className="text-red-500 mb-8">
                Cần đạt ít nhất <strong>7/10</strong> để hoàn thành bài học
              </p>
              <div className="space-y-3">
                <button
                  onClick={restartTest}
                  className="w-full bg-[#E85A4F] hover:bg-[#d94a3f] text-white font-bold py-4 rounded-2xl text-lg transition-all active:scale-95"
                >
                  Làm lại bài kiểm tra
                </button>
                <button
                  onClick={() => navigate(`/kana-lesson/${lessonId}`)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-2xl text-lg transition-all"
                >
                  Về bài học
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const isWriting = currentQ.type === "writing";
  const strokesDone = writingStrokeProgress[currentIndex] || 0;
  const totalStrokes = currentQ.totalStrokes || 1;
  const currentTemplateSvg = kana?.strokes?.[strokesDone]?.svg || "";

  return (
    <div className="min-h-screen bg-[#FAF9F8] font-sans pb-20">
      <style>{`
        @keyframes draw {
          from { stroke-dashoffset: 12000; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>

      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-4 max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="w-6 h-6 text-[#474747]" />
          </button>
          <h1 className="text-xl font-black text-[#474747]">
            Kiểm tra: {lesson.name}
          </h1>
        </div>
      </header>

      <main className="px-6 max-w-2xl mx-auto py-6">
        <div className="mb-6">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E85A4F] transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>
              Câu {currentIndex + 1}/{questions.length}
            </span>
            <span>Điểm: {score}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-[#E0E0E0] p-6">
          <h2 className="text-xl font-bold text-[#474747] mb-6 text-center">
            {currentQ.question}
          </h2>

          <div className="text-center mb-8">
            <div className="text-8xl font-black text-[#E85A4F]">
              {currentQ.display}
            </div>
          </div>

          {!isWriting ? (
            // Trắc nghiệm
            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const isCorrect = opt === currentQ.correctAnswer;
                    if (isCorrect) setScore((s) => s + 1);
                    setTimeout(() => {
                      if (currentIndex + 1 < questions.length) {
                        setCurrentIndex((i) => i + 1);
                      } else {
                        finishTest();
                      }
                    }, 700);
                  }}
                  className="w-full text-left p-5 rounded-xl border-2 border-gray-200 hover:border-[#E85A4F] transition-all text-lg"
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            // Viết chữ
            <div className="space-y-6">
              <div className="text-center">
                <span className="inline-block bg-white px-5 py-2 rounded-full border text-sm">
                  Tiến độ nét:{" "}
                  <span className="font-bold text-[#E85A4F]">
                    {strokesDone}/{totalStrokes}
                  </span>
                </span>
              </div>

              <div className="relative w-full aspect-square bg-gray-50 rounded-2xl border border-dashed border-gray-300 overflow-hidden">
                {showGuide && kana?.svg_content && (
                  <div
                    className="absolute inset-0 p-10 pointer-events-none"
                    dangerouslySetInnerHTML={{
                      __html: bgSvgStyle(kana.svg_content),
                    }}
                  />
                )}

                {kana?.svg_content &&
                  Array.from({ length: strokesDone }).map((_, idx) => (
                    <div
                      key={`completed-${idx}`}
                      className="absolute inset-0 p-10 pointer-events-none"
                      dangerouslySetInnerHTML={{
                        __html: completedStrokeStyle(kana.svg_content, idx),
                      }}
                    />
                  ))}

                {showGuide &&
                  kana?.svg_content &&
                  strokesDone < totalStrokes && (
                    <div
                      className="absolute inset-0 p-10 pointer-events-none"
                      dangerouslySetInnerHTML={{
                        __html: getHintSvgForStroke(
                          kana.svg_content,
                          strokesDone
                        ),
                      }}
                    />
                  )}

                <div className="absolute inset-0 p-10">
                  <CustomCanvas
                    ref={canvasRef}
                    width={500}
                    height={500}
                    disabled={isProcessing || !currentTemplateSvg}
                    templateSvg={currentTemplateSvg}
                    onStrokeComplete={handleStrokeComplete}
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={toggleShowGuide}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${
                    showGuide
                      ? "bg-[#FEE9E7] text-[#E85A4F]"
                      : "bg-gray-100 text-gray-600"
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

              {dynamicHint && (
                <p className="text-center text-sm font-medium text-[#E85A4F] bg-[#FEE9E7] py-3 px-6 rounded-full">
                  {dynamicHint}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default KanaTestPage;
