import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, RotateCcw } from "lucide-react";
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
  const { currentSet, fetchFlashcardSetDetail, updateItemMemorized, loading } = useFlashcardStore();

  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0);
  const [memorizedCount, setMemorizedCount] = useState(0);
  const [laterCount, setLaterCount] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [toastMessage, setToastMessage] = useState(null);
  const [chipZoom, setChipZoom] = useState({ memorized: false, later: false });
  // eslint-disable-next-line no-unused-vars
  const [memorizedIds, setMemorizedIds] = useState(new Set());
  // eslint-disable-next-line no-unused-vars
  const [laterIds, setLaterIds] = useState(new Set());
  const historyStack = useRef([]);

  // --- Giá trị Motion cho cử chỉ lướt ---
  const dragX = useMotionValue(0);
  const dragRotate = useTransform(dragX, [-200, 200], [-15, 15]);

  // Biến đổi màu nền và viền dựa trên vị trí kéo
  // Sang phải (200px): xanh lá, Sang trái (-200px): cam, Ở giữa: trắng
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
  
  // Hiển thị nhãn text khi kéo
  const labelLaterOpacity = useTransform(dragX, [-100, -20], [1, 0]);
  const labelMemorizedOpacity = useTransform(dragX, [20, 100], [0, 1]);

  useEffect(() => {
    if (id) fetchFlashcardSetDetail(id);
  }, [id, fetchFlashcardSetDetail]);

  const items = useMemo(() => currentSet?.items || [], [currentSet]);

  const handleStart = () => {
    setStarted(true);
    setCurrentIndex(0);
    setIsFlipped(false);
    setMemorizedCount(0);
    setLaterCount(0);
    historyStack.current = [];
  };

  const moveToNext = (dir) => {
    setDirection(dir);
    if (currentIndex < items.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      navigate("/flashcard");
    }
  };

  const handleMemorized = async () => {
    const currentItem = items[currentIndex];
    if (!currentItem) return;
    const id = currentItem.id;
    historyStack.current.push({ id, type: "memorized", fromIndex: currentIndex });
    await updateItemMemorized(id, true);
    setMemorizedCount((prev) => prev + 1);
    setMemorizedIds((prev) => new Set(prev).add(id));
    setChipZoom({ memorized: true, later: false });
    moveToNext(1);
    setTimeout(() => setChipZoom({ memorized: false, later: false }), 300);
  };

  const handleLater = () => {
    const currentItem = items[currentIndex];
    if (!currentItem) return;
    const id = currentItem.id;
    historyStack.current.push({ id, type: "later", fromIndex: currentIndex });
    setLaterCount((prev) => prev + 1);
    setLaterIds((prev) => new Set(prev).add(id));
    setChipZoom({ memorized: false, later: true });
    moveToNext(-1);
    setTimeout(() => setChipZoom({ memorized: false, later: false }), 300);
  };

  const handleUndo = () => {
    if (historyStack.current.length === 0) return;
    const { type, fromIndex } = historyStack.current.pop();
    if (type === "memorized") setMemorizedCount((prev) => prev - 1);
    else setLaterCount((prev) => prev - 1);
    setCurrentIndex(fromIndex);
    setIsFlipped(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">Đang tải...</div>;

  if (!started) {
    return (
        <div className="fixed inset-0 bg-[#FDFDFD] flex flex-col items-center justify-center p-6 text-center touch-none">
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="w-40 h-40 rounded-full bg-[#FEF2F2] flex items-center justify-center mb-8 shadow-xl">
                <span className="text-6xl font-black text-[#FF6B6B]">{items.length}</span>
            </motion.div>
            <h1 className="text-3xl font-black text-gray-800 mb-2 italic uppercase">Sẵn sàng chưa?</h1>
            <p className="text-gray-400 mb-10 font-medium">Vuốt Phải nếu đã thuộc, vuốt Trái để học sau</p>
            <button onClick={handleStart} className="w-full max-w-xs py-5 bg-[#FF6B6B] text-white rounded-[2rem] font-black text-xl shadow-lg active:scale-95 transition-transform">
                BẮT ĐẦU NGAY
            </button>
        </div>
    );
  }

  const currentItem = items[currentIndex];
  const vocab = currentItem?.vocabulary_detail || {};
  const progress = ((currentIndex + 1) / items.length) * 100;

  return (
    <div className="fixed inset-0 bg-[#FDFDFD] flex flex-col font-sans overflow-hidden select-none touch-none">
      {/* Header */}
      <div className="px-6 pt-12">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center active:scale-75 transition-transform">
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <div className="text-xl font-black text-gray-800 tracking-tighter italic">
            <span className="text-[#FF6B6B]">{currentIndex + 1}</span><span className="mx-1 text-gray-300">/</span>{items.length}
          </div>
          <div className="w-12" />
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-[#FF6B6B] to-[#FFCC99]" />
        </div>
      </div>

      {/* Flashcard Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative">
        <div className="w-full max-w-sm aspect-[3/4.2] relative perspective-2000">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentIndex}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              style={{ x: dragX, rotate: dragRotate }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 100) handleMemorized();
                else if (info.offset.x < -100) handleLater();
              }}
              className="w-full h-full"
            >
              <motion.div 
                className="w-full h-full relative rounded-[3rem] shadow-2xl overflow-hidden border-[6px]"
                style={{ 
                    backgroundColor: cardBg, 
                    borderColor: cardBorder,
                    transformStyle: "preserve-3d" 
                }}
                onClick={() => Math.abs(dragX.get()) < 5 && setIsFlipped(!isFlipped)}
              >
                {/* Overlay Nhãn Đã thuộc */}
                <motion.div style={{ opacity: labelMemorizedOpacity }} className="absolute inset-0 z-20 flex items-center justify-center bg-green-500/10 pointer-events-none">
                    <div className="border-4 border-green-500 rounded-2xl px-6 py-2">
                        <span className="text-green-500 font-black text-3xl uppercase">Đã thuộc</span>
                    </div>
                </motion.div>

                {/* Overlay Nhãn Chưa thuộc */}
                <motion.div style={{ opacity: labelLaterOpacity }} className="absolute inset-0 z-20 flex items-center justify-center bg-orange-500/10 pointer-events-none">
                    <div className="border-4 border-orange-500 rounded-2xl px-6 py-2">
                        <span className="text-orange-500 font-black text-3xl uppercase">Học sau</span>
                    </div>
                </motion.div>

                <motion.div
                  className="w-full h-full relative"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 150, damping: 20 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* FRONT */}
                  <div className="absolute inset-0 w-full h-full backface-hidden flex flex-col" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                    {currentItem?.user_image ? (
                        <img src={currentItem.user_image} alt="flashcard" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-9xl opacity-10 font-black italic">?</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute bottom-8 w-full text-center">
                        <span className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Chạm để lật</span>
                    </div>
                  </div>

                  {/* BACK */}
                  <div className="absolute inset-0 w-full h-full backface-hidden p-10 flex flex-col items-center justify-center" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                    <h2 className="text-5xl font-black text-gray-800 mb-2 leading-none">{vocab.word}</h2>
                    <p className="text-xl text-[#FF6B6B] font-bold mb-8 italic">/{vocab.pronunciation}/</p>
                    <p className="text-3xl font-bold text-gray-700 text-center leading-tight mb-8">{vocab.meaning}</p>
                    {vocab.example_sentence && (
                        <div className="w-full p-5 bg-gray-50 rounded-4xl border border-gray-100 shadow-inner">
                          <p className="text-[15px] text-gray-700 text-center leading-relaxed font-bold italic">
                            "{vocab.example_sentence}"
                          </p>
                          {vocab.example_translation && (
                            <p className="text-[12px] text-gray-400 text-center mt-3 font-medium uppercase tracking-tighter">
                              {vocab.example_translation}
                            </p>
                          )}
                        </div>
                      )}
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Stats & Undo */}
        <div className="flex gap-14 mt-12 items-center">
          <motion.div animate={{ scale: chipZoom.later ? 1.3 : 1 }} className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-2 border border-orange-100 shadow-sm">
              <span className="text-2xl">🎓</span>
            </div>
            <span className="text-sm font-black text-orange-500">{laterCount}</span>
          </motion.div>

          <button onClick={handleUndo} className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-gray-400 active:scale-75 transition-transform border border-gray-100">
            <RotateCcw className="w-5 h-5" />
          </button>

          <motion.div animate={{ scale: chipZoom.memorized ? 1.3 : 1 }} className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-2 border border-green-100 shadow-sm">
              <span className="text-2xl">✔️</span>
            </div>
            <span className="text-sm font-black text-green-600">{memorizedCount}</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardPracticePage;