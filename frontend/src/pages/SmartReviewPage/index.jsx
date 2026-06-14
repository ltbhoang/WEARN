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
  RotateCcw,
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
  const [questionCount, setQuestionCount] = useState(10); // 10, 15, 20

  const slideTransition = {
    type: "tween",
    ease: "easeInOut",
    duration: 0.3,
  };

  // Load dữ liệu SM-2 từ localStorage
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

  // Tạo câu hỏi dựa trên tất cả các bộ flashcard, chỉ lấy từ đến hạn ôn
  const generateQuestions = (sets, limit = 10) => {
    if (!sets || sets.length === 0) return [];

    const now = Date.now();
    const allWords = [];

    for (const set of sets) {
      for (const item of set.items) {
        if (item.vocabulary_detail) {
          const sm2Info = localSm2Map[item.id] || {
            nextReviewDate: 0,
            ef: 2.5,
          };
          if (sm2Info.nextReviewDate <= now) {
            allWords.push({
              id: item.id,
              word: item.vocabulary_detail.word,
              meaning: item.vocabulary_detail.meaning,
              reading:
                item.vocabulary_detail.reading_hiragana ||
                item.vocabulary_detail.pronunciation,
              audioUrl: item.vocabulary_detail.audio_url,
              image: item.user_image || item.vocabulary_detail.image_url,
              memorized: item.memorized,
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
    
    const essayIndices = new Set(
      indices.slice(0, Math.min(3, selectedWords.length))
    );
    const mcqIndices = indices.slice(
      Math.min(3, selectedWords.length),
      selectedWords.length
    );

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
          options: options,
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
    try {
      const audio = audioInstanceRef.current;
      audio.pause();
      audio.src = url;
      audio.load();
      audio.play().catch((e) => console.warn("Lỗi phát âm thanh:", e));
    } catch (err) {
      console.error("Audio error:", err);
    }
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
      setShowFeedback({ ok: true, msg: "Chính xác!" });
    } else {
      qualityScore = 0;
      setShowFeedback({
        ok: false,
        msg: `Sai rồi! Đáp án đúng: ${currentQ.correctMeaning}`,
      });
    }

    updateLocalSM2(currentQ.id, qualityScore);

    setTimeout(() => {
      setShowFeedback(null);
      moveToNextQuestion();
    }, 1200);
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

  // ---------- Màn hình kết thúc bình thường ----------
  if (isFinished) {
    const total = userAnswers.length;
    const correctCount = userAnswers.filter((a) => a && a.isCorrect).length;
    const accuracy = total ? Math.round((correctCount / total) * 100) : 0;

    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-gray-200 p-6 rounded-2xl shadow-sm text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Kết quả ôn tập</h2>
          <p className="text-sm text-gray-500 mb-6">Bạn đã hoàn thành phiên học này</p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 grid grid-cols-3 gap-2">
            <div>
              <div className="text-xl font-bold text-green-600">{correctCount}</div>
              <div className="text-xs text-gray-500 mt-1">Đúng</div>
            </div>
            <div>
              <div className="text-xl font-bold text-red-500">{total - correctCount}</div>
              <div className="text-xs text-gray-500 mt-1">Sai / Bỏ qua</div>
            </div>
            <div>
              <div className="text-xl font-bold text-blue-600">{accuracy}%</div>
              <div className="text-xs text-gray-500 mt-1">Chính xác</div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-[#FF6B6B] text-white rounded-xl font-semibold text-sm hover:bg-[#ff5757] transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Ôn tập lại
            </button>
            <button
              onClick={() => navigate("/flashcard")}
              className="w-full py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" /> Về danh sách bộ từ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Màn hình chưa bắt đầu ----------
  if (!started) {
    if (loading || questions.length === 0) {
      return (
        <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#FF6B6B]" />
        </div>
      );
    }
    return (
      <div className="fixed inset-0 bg-[#FDFDFD] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center max-w-sm w-full"
        >
          {/* Vòng tròn đếm ngược hoặc nút chơi */}
          <div className="w-32 h-32 rounded-full bg-red-50 flex items-center justify-center mb-6 border border-red-100 relative">
            <AnimatePresence mode="wait">
              {countdown === null ? (
                <motion.div
                  key="play"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Play className="w-10 h-10 text-[#FF6B6B] fill-[#FF6B6B] ml-1" />
                </motion.div>
              ) : (
                <motion.span
                  key={countdown}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-4xl font-black text-[#FF6B6B] absolute"
                >
                  {countdown === 0 ? "GO!" : countdown}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {countdown === null && (
            <>
              {/* Tên chức năng */}
              <h1 className="text-xl font-bold text-gray-800 mb-2">Ôn tập thông minh</h1>
              
              {/* Chọn số câu hỏi hiển thị ngay bên dưới */}
              <div className="flex gap-2 mb-4 justify-center">
                {[10, 15, 20].map((num) => (
                  <button
                    key={num}
                    onClick={() => setQuestionCount(num)}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                      questionCount === num
                        ? "bg-[#FF6B6B] text-white shadow-sm"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {num} câu
                  </button>
                ))}
              </div>

              <p className="text-gray-400 text-xs mb-6">
                Có {questions.length} từ vựng đã đến lịch cần ôn tập
              </p>

              <button
                onClick={handleStart}
                className="w-full py-3.5 bg-[#FF6B6B] text-white rounded-xl font-bold text-base hover:bg-[#ff5757] transition-all shadow-sm"
              >
                BẮT ĐẦU ÔN
              </button>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  // ---------- Đang làm bài ----------
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
            className="w-9 h-9 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            Câu: <span className="text-[#FF6B6B] font-black">{currentIndex + 1}</span>/{questions.length}
          </div>

          <button
            onClick={handleSkip}
            disabled={!!showFeedback}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 transition-all ${
              !!showFeedback
                ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
            }`}
          >
            Bỏ qua <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
            className="h-full bg-[#FF6B6B]"
          />
        </div>
      </div>

      {/* Vùng nội dung chính - Fix hiệu ứng chuyển động ngang */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-xl w-full mx-auto relative overflow-hidden">
        <div className="w-full min-h-[420px] max-h-[65vh] relative flex items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`question-${currentIndex}`}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -80 }}
              transition={slideTransition}
              className="w-full absolute flex flex-col items-center justify-start py-2"
            >
              <div className="text-5xl font-black text-gray-800 mb-1 tracking-tight text-center">
                {currentQ.word}
              </div>

              {currentQ.reading && (
                <p className="text-base text-gray-400 font-medium mb-3 tracking-wide text-center">
                  〔 {currentQ.reading} 〕
                </p>
              )}

              <button
                onClick={() => playAudio(currentQ.audioUrl)}
                className="mb-4 p-2.5 rounded-full bg-white shadow-sm border border-gray-100 hover:bg-gray-50 text-[#FF6B6B]"
              >
                <Volume2 className="w-5 h-5 fill-current" />
              </button>

              {currentQ.image && (
                <div className="mb-4 h-24 rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white p-1">
                  <img
                    src={currentQ.image}
                    alt="Hint"
                    className="h-full object-contain rounded-lg"
                  />
                </div>
              )}

              <div className="w-full mt-2">
                {currentQ.type === "mcq" ? (
                  <div className="w-full space-y-2">
                    {currentQ.options.map((opt, idx) => {
                      const isSelected = selectedOption === opt;
                      return (
                        <button
                          key={`${currentIndex}-opt-${idx}`}
                          onClick={() => {
                            if (showFeedback) return;
                            setSelectedOption(opt);
                            handleAnswer(opt === currentQ.correctMeaning, opt);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl border font-semibold text-sm transition-all ${
                            isSelected
                              ? "border-[#FF6B6B] bg-red-50/40 text-[#FF6B6B]"
                              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold border ${
                                isSelected
                                  ? "bg-[#FF6B6B] text-white border-[#FF6B6B]"
                                  : "bg-gray-50 text-gray-400 border-gray-200"
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span className="flex-1 truncate">{opt}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="w-full bg-white p-3 rounded-xl border border-gray-200">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={typedAnswer}
                        onChange={(e) => setTypedAnswer(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          !showFeedback &&
                          handleAnswer(
                            typedAnswer.trim().toLowerCase() ===
                              currentQ.correctMeaning.toLowerCase(),
                            typedAnswer
                          )
                        }
                        placeholder="Nhập nghĩa tiếng Việt..."
                        className="w-full pl-3 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B6B] text-sm font-medium"
                        autoFocus
                        disabled={!!showFeedback}
                      />
                      <button
                        onClick={() =>
                          !showFeedback &&
                          handleAnswer(
                            typedAnswer.trim().toLowerCase() ===
                              currentQ.correctMeaning.toLowerCase(),
                            typedAnswer
                          )
                        }
                        className="absolute right-1.5 p-2 bg-[#FF6B6B] hover:bg-[#ff5757] text-white rounded-md transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Thông báo đúng/sai */}
        <div className="w-full min-h-12 mt-2 z-20">
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border ${
                  showFeedback.ok
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                {showFeedback.ok ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                )}
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