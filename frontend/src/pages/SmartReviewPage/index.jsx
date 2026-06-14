// src/pages/smart-review/SmartReviewPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Play,
  CheckCircle2,
  XCircle,
  Home,
  Volume2,
  Send,
  FastForward,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFlashcardStore } from "../../store/flashcardStore";
import { useSM2 } from "../../hooks/useSM2";

const SmartReviewPage = () => {
  const navigate = useNavigate();
  const { flashcardSets, updateFlashcardItemStatus } = useFlashcardStore();
  const audioInstanceRef = useRef(new Audio());
  const { updateWord } = useSM2();

  // ---------- State ----------
  const [started, setStarted] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(null);
  const [localSm2Map, setLocalSm2Map] = useState({});
  const [questionCount, setQuestionCount] = useState(10);

  // Load dữ liệu SM-2 cũ (key cũ)
  useEffect(() => {
    const stored = localStorage.getItem("smart_review_sm2_data");
    if (stored) {
      try {
        setLocalSm2Map(JSON.parse(stored));
      } catch (e) {
        console.error("Lỗi parse dữ liệu SM-2", e);
      }
    }
  }, []);

  const updateLocalSM2 = async (wordId, quality) => {
    const updated = await updateWord(wordId, quality);
    setLocalSm2Map((prev) => ({ ...prev, [wordId]: updated }));
    if (quality >= 4 && updateFlashcardItemStatus) {
      updateFlashcardItemStatus(wordId, true);
    }
  };

  // Tạo câu hỏi từ tất cả flashcard, chỉ lấy từ đến hạn ôn
  const generateQuestions = (sets, limit = 10) => {
    if (!sets || sets.length === 0) return [];

    const now = Date.now();
    const allWords = [];

    for (const set of sets) {
      for (const item of set.items) {
        if (item.vocabulary_detail) {
          const sm2Info = localSm2Map[item.id] || { nextReviewDate: 0, ef: 2.5 };
          if (sm2Info.nextReviewDate <= now) {
            allWords.push({
              id: item.id,
              word: item.vocabulary_detail.word,
              meaning: item.vocabulary_detail.meaning,
              reading: item.vocabulary_detail.reading_hiragana || item.vocabulary_detail.pronunciation,
              audioUrl: item.vocabulary_detail.audio_url,
              image: item.user_image || item.vocabulary_detail.image_url,
              nextReviewDate: sm2Info.nextReviewDate,
              ef: sm2Info.ef,
            });
          }
        }
      }
    }

    if (allWords.length === 0) return [];

    allWords.sort((a, b) => a.nextReviewDate - b.nextReviewDate);
    const selectedWords = allWords.slice(0, limit);
    const indices = Array.from({ length: selectedWords.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const essayCount = Math.min(3, selectedWords.length);
    const essayIndices = new Set(indices.slice(0, essayCount));
    const mcqIndices = indices.slice(essayCount);

    const questionList = [];
    const allMeanings = allWords.map((w) => w.meaning).filter((m) => m);

    essayIndices.forEach((idx) => {
      const w = selectedWords[idx];
      if (w) {
        questionList.push({
          id: w.id,
          type: "essay",
          word: w.word,
          reading: w.reading,
          correctMeaning: w.meaning,
          audioUrl: w.audioUrl,
          image: w.image,
        });
      }
    });

    mcqIndices.forEach((idx) => {
      const w = selectedWords[idx];
      if (w) {
        let wrongOptions = [];
        const otherMeanings = allMeanings.filter((m) => m !== w.meaning);
        const shuffledOthers = [...otherMeanings].sort(() => 0.5 - Math.random());
        wrongOptions = shuffledOthers.slice(0, 3);
        while (wrongOptions.length < 3) wrongOptions.push(w.meaning + " (lặp)");
        const options = [w.meaning, ...wrongOptions].sort(() => 0.5 - Math.random());
        questionList.push({
          id: w.id,
          type: "mcq",
          word: w.word,
          reading: w.reading,
          correctMeaning: w.meaning,
          options,
          audioUrl: w.audioUrl,
          image: w.image,
        });
      }
    });

    return questionList.sort(() => 0.5 - Math.random());
  };

  useEffect(() => {
    if (flashcardSets.length > 0 && !started && !isFinished) {
      const qs = generateQuestions(flashcardSets, questionCount);
      setQuestions(qs);
      setUserAnswers(new Array(qs.length).fill(null));
    }
    setLoading(false);
  }, [flashcardSets, localSm2Map, questionCount, started, isFinished]);

  // Countdown logic
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    setStarted(true);
  }, [countdown]);

  const handleStart = () => setCountdown(3);

  const playAudio = (url) => {
    if (!url) return;
    const audio = audioInstanceRef.current;
    audio.pause();
    audio.src = url;
    audio.load();
    audio.play().catch((e) => console.warn("Lỗi phát âm thanh:", e));
  };

  useEffect(() => {
    if (started && !isFinished && questions[currentIndex]?.audioUrl) {
      playAudio(questions[currentIndex].audioUrl);
    }
  }, [currentIndex, started, isFinished, questions]);

  const moveToNextQuestion = () => {
    setSelectedOption(null);
    setTypedAnswer("");
    if (currentIndex + 1 === questions.length) {
      setIsFinished(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleAnswer = (isCorrect, answerValue) => {
    if (showFeedback) return;
    const currentQ = questions[currentIndex];
    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = { isCorrect, answer: answerValue };
    setUserAnswers(newAnswers);

    let qualityScore = 0;
    if (isCorrect) {
      qualityScore = currentQ.type === "mcq" ? 5 : 4;
      setShowFeedback({ ok: true, msg: "Tuyệt vời! Tuyệt đối chính xác 🎉" });
    } else {
      qualityScore = 0;
      setShowFeedback({ ok: false, msg: `Chưa chính xác! Đáp án đúng: ${currentQ.correctMeaning}` });
    }
    updateLocalSM2(currentQ.id, qualityScore);
    setTimeout(() => {
      setShowFeedback(null);
      moveToNextQuestion();
    }, 1000);
  };

  const handleSkip = () => {
    if (showFeedback) return;
    const currentQ = questions[currentIndex];
    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = { isCorrect: false, answer: "Bỏ qua" };
    setUserAnswers(newAnswers);
    updateLocalSM2(currentQ.id, 1);
    moveToNextQuestion();
  };

  // ---------- MÀN HÌNH KẾT THÚC (đơn giản, không animation phức tạp) ----------
  if (isFinished) {
    const total = userAnswers.length;
    const correctCount = userAnswers.filter((a) => a && a.isCorrect).length;
    const accuracy = total ? Math.round((correctCount / total) * 100) : 0;
    return (
      <div className="fixed inset-0 bg-[#FDFDFD] flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
        <div className="w-full max-w-md bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-xl">
          <div className="text-8xl mb-4">🏆</div>
          <h1 className="text-3xl font-black text-gray-800 mb-1">HOÀN THÀNH!</h1>
          <p className="text-gray-400 font-medium mb-8">Hệ thống SM-2 đã cập nhật lịch trình ôn tập của bạn</p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-green-50/60 p-5 rounded-4xl border border-green-100/70">
              <CheckCircle2 className="w-7 h-7 text-green-500 mx-auto mb-2" />
              <div className="text-3xl font-black text-green-600">{correctCount}</div>
              <div className="text-xs font-bold text-green-500/80">Đúng</div>
            </div>
            <div className="bg-red-50/60 p-5 rounded-4xl border border-red-100/70">
              <XCircle className="w-7 h-7 text-red-500 mx-auto mb-2" />
              <div className="text-3xl font-black text-red-600">{total - correctCount}</div>
              <div className="text-xs font-bold text-red-500/80">Sai/Bỏ qua</div>
            </div>
          </div>
          <div className="mb-8 p-4 bg-gray-50 rounded-2xl">
            <span className="text-xs font-bold text-gray-400 uppercase">Độ chính xác phiên này</span>
            <div className="text-5xl font-black text-[#FF6B6B]">{accuracy}%</div>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-[#FF6B6B] text-white rounded-3xl font-bold text-lg shadow-lg hover:bg-[#ff5757] transition-all"
            >
              TIẾP TỤC ÔN TẬP
            </button>
            <button
              onClick={() => navigate("/flashcard")}
              className="w-full py-4 text-gray-500 hover:text-gray-700 font-bold text-base flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" /> VỀ TRANG CHÍNH
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- MÀN HÌNH CHỌN SỐ CÂU HỎI & ĐẾM NGƯỢC ----------
  if (!started) {
    if (loading || questions.length === 0) {
      return (
        <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-gray-100 border-t-[#FF6B6B]" />
        </div>
      );
    }
    return (
      <div className="fixed inset-0 bg-[#FDFDFD] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center max-w-sm w-full">
          <div className="w-40 h-40 rounded-full bg-red-50 flex items-center justify-center mb-8 shadow-inner border border-red-100 relative">
            <AnimatePresence mode="wait">
              {countdown === null ? (
                <motion.div key="play" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Play className="w-14 h-14 text-[#FF6B6B] fill-[#FF6B6B] ml-1" />
                </motion.div>
              ) : (
                <motion.span
                  key={countdown}
                  initial={{ scale: 0.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-6xl font-black text-[#FF6B6B] absolute"
                >
                  {countdown === 0 ? "GO!" : countdown}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {countdown === null && (
            <>
              <h2 className="text-2xl font-bold text-gray-700 mb-4">Ôn tập thông minh</h2>
              <div className="flex gap-3 mb-6">
                {[10, 15, 20].map((num) => (
                  <button
                    key={num}
                    onClick={() => setQuestionCount(num)}
                    className={`px-5 py-2 rounded-full font-bold transition-all ${
                      questionCount === num
                        ? "bg-[#FF6B6B] text-white shadow-md"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <p className="text-gray-500 font-medium text-sm mb-1">{questions.length} từ vựng cần ôn</p>
              <button
                onClick={handleStart}
                className="w-full py-4 bg-[#FF6B6B] text-white rounded-3xl font-bold text-lg shadow-xl hover:bg-[#ff5757] transition-all"
              >
                BẮT ĐẦU ÔN TẬP
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---------- ĐANG LÀM BÀI ----------
  const currentQ = questions[currentIndex];
  if (!currentQ) return null;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="fixed inset-0 bg-[#FDFDFD] flex flex-col font-sans select-none overflow-hidden">
      {/* Header & progress bar */}
      <div className="px-6 pt-10 pb-4 max-w-xl w-full mx-auto z-20 bg-[#FDFDFD]">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/flashcard")}
            className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-sm font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
            Câu số: <span className="text-[#FF6B6B] font-black">{currentIndex + 1}</span>/{questions.length}
          </div>
          <button
            onClick={handleSkip}
            disabled={!!showFeedback}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 bg-white text-gray-500 border-gray-200"
          >
            Bỏ qua <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#FF6B6B] to-[#FF9E7D]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Vùng câu hỏi với hiệu ứng chuyển ngang chuẩn */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-xl w-full mx-auto relative">
        <div className="w-full relative overflow-y-auto min-h-[480px] max-h-[70vh]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`question-${currentIndex}`}
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "-100%" }}
              transition={slideTransition}
              className="w-full flex flex-col items-center justify-start pt-4 pb-4"
            >
              <div className="text-5xl font-black text-gray-800 mb-1 text-center">{currentQ.word}</div>
              {currentQ.reading && <p className="text-base text-gray-400 font-medium mb-3">〔 {currentQ.reading} 〕</p>}
              <button
                onClick={() => playAudio(currentQ.audioUrl)}
                className="mb-4 p-3 rounded-full bg-white shadow-md border border-gray-100 text-[#FF6B6B]"
              >
                <Volume2 className="w-5 h-5 fill-current" />
              </button>
              {currentQ.image && (
                <div className="mb-4 h-24 rounded-xl overflow-hidden shadow-sm bg-white p-1">
                  <img src={currentQ.image} alt="Hint" className="h-full object-contain" />
                </div>
              )}

              <div className="w-full mt-2">
                {currentQ.type === "mcq" ? (
                  <div className="w-full space-y-2.5">
                    {currentQ.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (showFeedback) return;
                          setSelectedOption(opt);
                          handleAnswer(opt === currentQ.correctMeaning, opt);
                        }}
                        className={`w-full text-left px-5 py-3.5 rounded-2xl border-2 font-bold text-base transition-all ${
                          selectedOption === opt
                            ? "border-[#FF6B6B] bg-red-50/50 text-[#FF6B6B]"
                            : "border-gray-100 bg-white text-gray-600 hover:border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 flex items-center justify-center rounded-lg text-xs font-black border bg-gray-50 text-gray-400 border-gray-200">
                            {idx + 1}
                          </span>
                          <span className="flex-1 truncate">{opt}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="w-full bg-white p-4 rounded-4xl border border-gray-100 shadow-sm">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={typedAnswer}
                        onChange={(e) => setTypedAnswer(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          !showFeedback &&
                          handleAnswer(
                            typedAnswer.trim().toLowerCase() === currentQ.correctMeaning.toLowerCase(),
                            typedAnswer
                          )
                        }
                        placeholder="Nhập nghĩa tiếng Việt..."
                        className="w-full pl-4 pr-12 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/20 focus:border-[#FF6B6B] bg-gray-50/50"
                        autoFocus
                        disabled={!!showFeedback}
                      />
                      <button
                        onClick={() =>
                          !showFeedback &&
                          handleAnswer(
                            typedAnswer.trim().toLowerCase() === currentQ.correctMeaning.toLowerCase(),
                            typedAnswer
                          )
                        }
                        className="absolute right-2 p-2 bg-[#FF6B6B] text-white rounded-lg"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="w-full min-h-16 mt-2">
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`w-full p-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 border ${
                  showFeedback.ok
                    ? "bg-green-50 border-green-100 text-green-700"
                    : "bg-red-50 border-red-100 text-red-700"
                }`}
              >
                {showFeedback.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span>{showFeedback.msg}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SmartReviewPage;