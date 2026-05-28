import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  RotateCcw,
  Play,
  CheckCircle2,
  XCircle,
  Home,
  RefreshCw,
  Volume2,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useFlashcardStore } from "../../store/flashcardStore";

const FlashcardPracticePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentSet, fetchFlashcardSetDetail, updateItemMemorized, loading } =
    useFlashcardStore();

  // --- States ---
  const [started, setStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0);
  const [memorizedCount, setMemorizedCount] = useState(0);
  const [laterCount, setLaterCount] = useState(0);
  const [chipZoom, setChipZoom] = useState({ memorized: false, later: false });
  const [practiceItems, setPracticeItems] = useState([]);
  const [resetting, setResetting] = useState(false);

  const historyStack = useRef([]);
  const isInitialized = useRef(false);

  // --- Framer Motion Values ---
  const dragX = useMotionValue(0);
  const dragRotate = useTransform(dragX, [-200, 200], [-15, 15]);
  const cardBg = useTransform(
    dragX,
    [-150, 0, 150],
    ["#FFF9F2", "#FFFFFF", "#F2FFF9"]
  );
  const cardBorder = useTransform(
    dragX,
    [-150, 0, 150],
    ["#FFB347", "#FFFFFF", "#27AE60"]
  );
  const labelLaterOpacity = useTransform(dragX, [-100, -20], [1, 0]);
  const labelMemorizedOpacity = useTransform(dragX, [20, 100], [0, 1]);

  // --- Effects ---
  useEffect(() => {
    if (id) fetchFlashcardSetDetail(id);
  }, [id, fetchFlashcardSetDetail]);

  // Chỉ khởi tạo practiceItems một lần khi currentSet có dữ liệu lần đầu
  useEffect(() => {
    if (currentSet?.items && !isInitialized.current) {
      setPracticeItems(currentSet.items);
      isInitialized.current = true;
    }
  }, [currentSet]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      const startTimer = setTimeout(() => setStarted(true), 800);
      return () => clearTimeout(startTimer);
    }
  }, [countdown]);

  // --- Handlers chính ---
  const handleStartRequest = () => setCountdown(3);

  const moveToNext = (dir) => {
    setDirection(dir);
    if (currentIndex < practiceItems.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        dragX.set(0);
      }, 50);
    } else {
      setIsFinished(true);
    }
  };

  const handleMemorized = async () => {
    const currentItem = practiceItems[currentIndex];
    if (!currentItem) return;
    historyStack.current.push({
      id: currentItem.id,
      type: "memorized",
      fromIndex: currentIndex,
    });
    await updateItemMemorized(currentItem.id, true);
    setMemorizedCount((prev) => prev + 1);
    setChipZoom({ memorized: true, later: false });
    moveToNext(1);
    setTimeout(() => setChipZoom({ memorized: false, later: false }), 300);
  };

  const handleLater = () => {
    const currentItem = practiceItems[currentIndex];
    if (!currentItem) return;
    historyStack.current.push({
      id: currentItem.id,
      type: "later",
      fromIndex: currentIndex,
    });
    setLaterCount((prev) => prev + 1);
    setChipZoom({ memorized: false, later: true });
    moveToNext(-1);
    setTimeout(() => setChipZoom({ memorized: false, later: false }), 300);
  };

  const handleUndo = () => {
    if (historyStack.current.length === 0) return;
    const lastAction = historyStack.current.pop();
    if (lastAction.type === "memorized") setMemorizedCount((prev) => prev - 1);
    else setLaterCount((prev) => prev - 1);
    setCurrentIndex(lastAction.fromIndex);
    setIsFlipped(false);
    dragX.set(0);
  };

  // --- Các chế độ ôn tập ---
  const handleRestart = () => {
    setPracticeItems(currentSet?.items || []);
    setIsFinished(false);
    setStarted(false);
    setCountdown(null);
    setCurrentIndex(0);
    setMemorizedCount(0);
    setLaterCount(0);
    historyStack.current = [];
    dragX.set(0);
  };

  // Ôn những từ chưa thuộc (dựa trên memorized trong DB)
  const handleReviewUnmemorized = () => {
    const allItems = currentSet?.items || [];
    const unmemorizedItems = allItems.filter((item) => !item.memorized);
    if (unmemorizedItems.length === 0) {
      alert("Chúc mừng! Bạn đã thuộc hết tất cả từ trong bộ này.");
      navigate("/flashcard");
      return;
    }
    setPracticeItems(unmemorizedItems);
    setIsFinished(false);
    setStarted(false);
    setCountdown(null);
    setCurrentIndex(0);
    setMemorizedCount(0);
    setLaterCount(0);
    historyStack.current = [];
    dragX.set(0);
  };

  // Ôn chỉ những từ đã "Học sau" trong phiên vừa rồi
  const handleReviewLaterOnly = () => {
    const laterIds = historyStack.current
      .filter((h) => h.type === "later")
      .map((h) => h.id);
    const laterItems = (currentSet?.items || []).filter((item) =>
      laterIds.includes(item.id)
    );
    if (laterItems.length === 0) {
      alert("Không có từ nào được đánh dấu 'Học sau' trong phiên này.");
      return;
    }
    setPracticeItems(laterItems);
    setIsFinished(false);
    setStarted(false);
    setCountdown(null);
    setCurrentIndex(0);
    setMemorizedCount(0);
    setLaterCount(0);
    historyStack.current = [];
    dragX.set(0);
  };

  const handlePlayAudio = () => {
    const currentItem = practiceItems[currentIndex];
    const vocab = currentItem?.vocabulary_detail || {};
    const audioUrl = vocab.audio_url;
    if (audioUrl) {
      new Audio(audioUrl).play().catch((err) => console.warn("Không thể phát audio", err));
    }
  };

  if (isFinished) {
    const accuracy =
      practiceItems.length > 0
        ? Math.round((memorizedCount / practiceItems.length) * 100)
        : 0;
    const unmemorizedCount = (currentSet?.items || []).filter(
      (item) => !item.memorized
    ).length;
    const laterOnlyCount = historyStack.current.filter((h) => h.type === "later").length;

    return (
      <div className="fixed inset-0 bg-[#FDFDFD] flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm"
        >
          <div className="text-8xl mb-6">🏆</div>
          <h1 className="text-4xl font-black text-gray-800 mb-2 italic">
            HOÀN THÀNH!
          </h1>
          <p className="text-gray-400 font-medium mb-10">
            Bạn đã xem hết {practiceItems.length} thẻ
          </p>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-green-50 p-6 rounded-[2.5rem] border border-green-100">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-3xl font-black text-green-600">
                {memorizedCount}
              </div>
              <div className="text-xs font-bold text-green-400 uppercase tracking-tighter">
                Đã thuộc
              </div>
            </div>
            <div className="bg-orange-50 p-6 rounded-[2.5rem] border border-orange-100">
              <XCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <div className="text-3xl font-black text-orange-600">
                {laterCount}
              </div>
              <div className="text-xs font-bold text-orange-400 uppercase tracking-tighter">
                Cần xem lại
              </div>
            </div>
          </div>

          <div className="mb-12">
            <span className="text-sm font-bold text-gray-300 uppercase tracking-widest">
              Độ chính xác
            </span>
            <div className="text-6xl font-black text-[#FF6B6B]">
              {accuracy}%
            </div>
          </div>

          <div className="space-y-4">
            {/* Ôn từ chưa thuộc (theo DB) */}
            {unmemorizedCount > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleReviewUnmemorized}
                className="w-full py-5 bg-[#27AE60] text-white rounded-[2rem] font-black text-xl shadow-xl shadow-green-100 flex items-center justify-center gap-3"
              >
                <RefreshCw className="w-6 h-6" /> ÔN TỪ CHƯA THUỘC ({unmemorizedCount})
              </motion.button>
            )}

            {/* Ôn từ đã "Học sau" trong phiên này */}
            {laterOnlyCount > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleReviewLaterOnly}
                className="w-full py-5 bg-[#FF8C42] text-white rounded-[2rem] font-black text-xl shadow-xl flex items-center justify-center gap-3"
              >
                <RefreshCw className="w-6 h-6" /> ÔN "HỌC SAU" TRONG PHIÊN ({laterOnlyCount})
              </motion.button>
            )}

            {/* Ôn lại tất cả */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleRestart}
              className="w-full py-5 bg-[#FF6B6B] text-white rounded-[2rem] font-black text-xl shadow-xl shadow-red-100 flex items-center justify-center gap-3"
            >
              <RotateCcw className="w-6 h-6" /> ÔN LẠI TẤT CẢ
            </motion.button>

            {/* Thoát */}
            <button
              onClick={() => navigate("/flashcard")}
              className="w-full py-5 text-gray-400 font-black text-lg flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" /> THOÁT RA
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Màn hình countdown
  if (!started) {
    return (
      <div className="fixed inset-0 bg-[#FDFDFD] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center"
        >
          <div className="w-44 h-44 rounded-full bg-[#FEF2F2] flex items-center justify-center mb-10 shadow-2xl border-4 border-white relative">
            <AnimatePresence mode="wait">
              {countdown === null ? (
                <motion.div key="play" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Play className="w-16 h-16 text-[#FF6B6B] fill-[#FF6B6B]" />
                </motion.div>
              ) : (
                <motion.span
                  key={countdown}
                  initial={{ scale: 0.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 2, opacity: 0 }}
                  className="text-7xl font-black text-[#FF6B6B] absolute"
                >
                  {countdown === 0 ? "GO!" : countdown}
                </motion.span>
              )}
            </AnimatePresence>
            {countdown !== null && (
              <motion.div
                animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="absolute inset-0 bg-[#FF6B6B] rounded-full"
              />
            )}
          </div>
          <h1 className="text-3xl font-black text-gray-800 mb-2 italic uppercase">Sẵn sàng chưa?</h1>
          <p className="text-gray-400 mb-12">{practiceItems.length} thẻ đang chờ bạn</p>
          {countdown === null && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStartRequest}
              className="w-64 py-5 bg-[#FF6B6B] text-white rounded-[2rem] font-black text-xl shadow-xl"
            >
              BẮT ĐẦU
            </motion.button>
          )}
        </motion.div>
      </div>
    );
  }

  // --- Giao diện học chính ---
  const currentItem = practiceItems[currentIndex];
  const vocab = currentItem?.vocabulary_detail || {};
  const progress =
    practiceItems.length > 0 ? ((currentIndex + 1) / practiceItems.length) * 100 : 0;
  const imageUrl = currentItem?.user_image || vocab.image_url;

  return (
    <div className="fixed inset-0 bg-[#FDFDFD] flex flex-col font-sans overflow-hidden touch-none select-none">
      <div className="px-6 pt-12">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <div className="text-xl font-black text-gray-800 italic">
            <span className="text-[#FF6B6B]">{currentIndex + 1}</span>
            <span className="mx-1 text-gray-300">/</span>
            {practiceItems.length}
          </div>
          <div className="w-12" />
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-[#FF6B6B] to-[#FFCC99]"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 relative">
        <div className="w-full max-w-sm aspect-[3/4.2] relative perspective-2000">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={`${practiceItems.length}-${currentIndex}`}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              style={{ x: dragX, rotate: dragRotate }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 100) handleMemorized();
                else if (info.offset.x < -100) handleLater();
              }}
              className="w-full h-full cursor-grab active:cursor-grabbing"
            >
              <motion.div
                className="w-full h-full relative rounded-[3rem] shadow-2xl overflow-hidden border-[6px]"
                style={{
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                  transformStyle: "preserve-3d",
                }}
                onClick={() => Math.abs(dragX.get()) < 5 && setIsFlipped(!isFlipped)}
              >
                <motion.div
                  style={{ opacity: labelMemorizedOpacity }}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-green-500/10 pointer-events-none"
                >
                  <div className="border-4 border-green-500 rounded-2xl px-6 py-2 rotate-12 text-green-500 font-black text-3xl uppercase">
                    Đã thuộc
                  </div>
                </motion.div>
                <motion.div
                  style={{ opacity: labelLaterOpacity }}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-orange-500/10 pointer-events-none"
                >
                  <div className="border-4 border-orange-500 rounded-2xl px-6 py-2 -rotate-12 text-orange-500 font-black text-3xl uppercase">
                    Học sau
                  </div>
                </motion.div>

                <motion.div
                  className="w-full h-full relative"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 150, damping: 20 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="absolute inset-0 w-full h-full bg-white" style={{ backfaceVisibility: "hidden" }}>
                    {imageUrl ? (
                      <img src={imageUrl} alt="img" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-9xl opacity-10 font-black italic">
                        ?
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                  </div>
                  <div
                    className="absolute inset-0 w-full h-full bg-white p-10 flex flex-col items-center justify-center"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <h2 className="text-5xl font-black text-gray-800 mb-2 leading-none">{vocab.word}</h2>
                    <p className="text-xl text-[#FF6B6B] font-bold mb-8 italic">
                      /{vocab.pronunciation || vocab.reading || ""}/
                    </p>
                    <div className="h-px w-12 bg-gray-100 mb-8" />
                    <p className="text-3xl font-bold text-gray-700 text-center leading-tight">{vocab.meaning}</p>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex gap-14 mt-12 items-center">
          <motion.div animate={{ scale: chipZoom.later ? 1.3 : 1 }} className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-2 border border-orange-100 shadow-sm text-2xl">
              🎓
            </div>
            <span className="text-sm font-black text-orange-500">{laterCount}</span>
          </motion.div>

          <div className="flex gap-6 items-center">
            <button
              onClick={handleUndo}
              className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-gray-400 border border-gray-100 active:scale-90 transition-transform"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={handlePlayAudio}
              className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-gray-400 border border-gray-100 active:scale-90 transition-transform"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <motion.div animate={{ scale: chipZoom.memorized ? 1.3 : 1 }} className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-2 border border-green-100 shadow-sm text-2xl">
              ✔️
            </div>
            <span className="text-sm font-black text-green-600">{memorizedCount}</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardPracticePage;