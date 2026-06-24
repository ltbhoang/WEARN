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
  Brain,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFlashcardStore } from "../../store/flashcardStore";

const SmartReviewPage = () => {
  const navigate = useNavigate();
  const {
    flashcardSets,
    dueVocabularies,
    fetchDueVocabularies,
    loading: storeLoading,
    submitReview: submitReviewStore,
  } = useFlashcardStore();
  const audioInstanceRef = useRef(new Audio());

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
  const [questionCount, setQuestionCount] = useState(10);
  const [dueWords, setDueWords] = useState([]);

  // Chế độ: 'smart' hoặc 'weak'
  const [mode, setMode] = useState(() => {
    return localStorage.getItem("review_mode") || "smart";
  });

  useEffect(() => {
    localStorage.setItem("review_mode", mode);
  }, [mode]);

  // Hàm tạo câu hỏi từ danh sách từ
  const generateQuestions = (words, limit = 10) => {
    if (!words || words.length === 0) return [];
    const selected = words.slice(0, limit);
    const indices = selected.map((_, i) => i);
    // Shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const essayCount = Math.min(3, selected.length);
    const essayIndices = new Set(indices.slice(0, essayCount));
    const mcqIndices = indices.slice(essayCount);

    const questionList = [];
    const allMeanings = selected.map((w) => w.meaning).filter((m) => m);

    essayIndices.forEach((idx) => {
      const w = selected[idx];
      if (w) {
        questionList.push({
          id: w.id,
          type: "essay",
          word: w.word,
          reading: w.reading_hiragana || w.pronunciation,
          correctMeaning: w.meaning,
          audioUrl: w.audio_url,
          image: w.image_url,
        });
      }
    });

    mcqIndices.forEach((idx) => {
      const w = selected[idx];
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
          reading: w.reading_hiragana || w.pronunciation,
          correctMeaning: w.meaning,
          options: options,
          audioUrl: w.audio_url,
          image: w.image_url,
        });
      }
    });
    return questionList.sort(() => 0.5 - Math.random());
  };

  // Lấy dữ liệu từ store
  const loadDueWords = async () => {
    setLoading(true);
    try {
      // Fetch dữ liệu từ store
      await fetchDueVocabularies();
      // Lấy dữ liệu từ store sau khi fetch
      const words = dueVocabularies;
      setDueWords(words);
      const qs = generateQuestions(words, questionCount);
      setQuestions(qs);
      setUserAnswers(new Array(qs.length).fill(null));
    } catch (error) {
      console.error("Error fetching due vocabularies:", error);
      setDueWords([]);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Tạo câu hỏi khi flashcardSets, mode, questionCount thay đổi (chỉ khi chưa bắt đầu)
  useEffect(() => {
    if (!started && !isFinished) {
      loadDueWords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashcardSets, questionCount, mode, started, isFinished]);

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

  // Gửi kết quả lên backend (dùng store)
  const submitReview = async (vocabularyId, grade) => {
    try {
      await submitReviewStore(vocabularyId, grade);
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  const handleAnswer = (isCorrect, answerValue) => {
    if (showFeedback) return;
    const currentQ = questions[currentIndex];
    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = { isCorrect, answer: answerValue };
    setUserAnswers(newAnswers);

    let grade = 0;
    if (isCorrect) {
      grade = currentQ.type === "mcq" ? 5 : 4;
      setShowFeedback({ ok: true, msg: "Chính xác!" });
    } else {
      grade = 0;
      setShowFeedback({ ok: false, msg: `Sai rồi! Đáp án đúng: ${currentQ.correctMeaning}` });
    }

    submitReview(currentQ.id, grade);

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
    submitReview(currentQ.id, 1);
    moveToNextQuestion();
  };

  // Ôn tiếp những từ chưa hỏi trong danh sách dueWords
  const continueWithRemaining = () => {
    const askedIds = questions.map((q) => q.id);
    const remainingWords = dueWords.filter((w) => !askedIds.includes(w.id));
    if (remainingWords.length === 0) return;
    const qs = generateQuestions(remainingWords, 100);
    if (qs.length === 0) return;
    setQuestions(qs);
    setUserAnswers(new Array(qs.length).fill(null));
    setCurrentIndex(0);
    setIsFinished(false);
    setStarted(false);
    setCountdown(3);
  };

  // Luyện lại từ sai trong phiên hiện tại
  const switchToWeakReview = () => {
    const wrongIds = userAnswers
      .map((ans, idx) => (ans && !ans.isCorrect ? questions[idx]?.id : null))
      .filter((id) => id);
    if (wrongIds.length === 0) return;
    const wrongWords = dueWords.filter((w) => wrongIds.includes(w.id));
    if (wrongWords.length === 0) return;
    const qs = generateQuestions(wrongWords, 100);
    if (qs.length === 0) return;
    setMode("weak");
    setQuestions(qs);
    setUserAnswers(new Array(qs.length).fill(null));
    setCurrentIndex(0);
    setIsFinished(false);
    setStarted(false);
    setCountdown(3);
  };

  // ---------- Màn hình kết thúc ----------
  if (isFinished) {
    const total = userAnswers.length;
    const correctCount = userAnswers.filter((a) => a && a.isCorrect).length;
    const accuracy = total ? Math.round((correctCount / total) * 100) : 0;
    const askedIds = questions.map((q) => q.id);
    const remainingCount = dueWords.filter((w) => !askedIds.includes(w.id)).length;
    const wrongCount = total - correctCount;

    return (
      <div className="min-h-screen bg-[#FAF9F8] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-[#E0E0E0]">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-[#474747] mb-2">Kết thúc ôn tập</h2>
          <p className="text-[#8E8D8A] text-sm mb-6">
            {mode === "smart" ? "Bạn đã hoàn thành phiên học thông minh" : "Bạn đã luyện xong các từ yếu"}
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 grid grid-cols-3 gap-2">
            <div>
              <div className="text-xl font-bold text-green-600">{correctCount}</div>
              <div className="text-xs text-gray-500 mt-1">Đúng</div>
            </div>
            <div>
              <div className="text-xl font-bold text-red-500">{wrongCount}</div>
              <div className="text-xs text-gray-500 mt-1">Sai / Bỏ qua</div>
            </div>
            <div>
              <div className="text-xl font-bold text-[#E85A4F]">{accuracy}%</div>
              <div className="text-xs text-gray-500 mt-1">Chính xác</div>
            </div>
          </div>

          <div className="space-y-3">
            {remainingCount > 0 && (
              <button
                onClick={continueWithRemaining}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl text-base transition-all"
              >
                Ôn tiếp {remainingCount} từ còn lại trong hôm nay
              </button>
            )}
            {mode === "smart" && wrongCount > 0 && (
              <button
                onClick={switchToWeakReview}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3.5 rounded-xl text-base transition-all"
              >
                🔁 Luyện lại {wrongCount} từ chưa thuộc
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#E85A4F] hover:bg-[#d94a3f] text-white font-bold py-3.5 rounded-xl text-base transition-all"
            >
              <RotateCcw className="w-4 h-4 inline mr-2" /> Ôn tập lại (theo chế độ hiện tại)
            </button>
            <button
              onClick={() => navigate("/flashcard")}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl text-base transition-all"
            >
              <Home className="w-4 h-4 inline mr-2" /> Về trang chính
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Màn hình chưa bắt đầu ----------
  if (!started) {
    if (loading || storeLoading) {
      return (
        <div className="min-h-screen bg-[#FAF9F8] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#E85A4F]" />
        </div>
      );
    }
    if (dueWords.length === 0) {
      const message =
        mode === "smart"
          ? "Hôm nay bạn đã ôn hết từ vựng cần nhắc lại. Hãy quay lại ngày mai."
          : "Chúc mừng! Bạn không còn từ yếu nào để luyện tập.";
      return (
        <div className="min-h-screen bg-[#FAF9F8] flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold text-gray-800">Chúc mừng!</h2>
          <p className="text-gray-500 mt-2">{message}</p>
          {mode === "smart" && (
            <button
              onClick={() => {
                setMode("weak");
                window.location.reload();
              }}
              className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-xl"
            >
              Chuyển sang luyện từ yếu
            </button>
          )}
          <button onClick={() => navigate("/flashcard")} className="mt-4 px-6 py-2 bg-[#E85A4F] text-white rounded-xl">
            Về trang chính
          </button>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#FAF9F8] flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center max-w-sm w-full"
        >
          <div className="w-32 h-32 rounded-full bg-red-50 flex items-center justify-center mb-6 border border-red-100 relative">
            <AnimatePresence mode="wait">
              {countdown === null ? (
                <motion.div
                  key="play"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Play className="w-12 h-12 text-[#E85A4F] fill-[#E85A4F] ml-1" />
                </motion.div>
              ) : (
                <motion.span
                  key={countdown}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-5xl font-black text-[#E85A4F] absolute"
                >
                  {countdown === 0 ? "GO!" : countdown}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {countdown === null && (
            <>
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setMode("smart")}
                  className={`px-4 py-2 rounded-full font-semibold transition-all flex items-center gap-2 ${
                    mode === "smart"
                      ? "bg-[#E85A4F] text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Brain className="w-4 h-4" />
                  Ôn thông minh (SM‑2)
                </button>
                <button
                  onClick={() => setMode("weak")}
                  className={`px-4 py-2 rounded-full font-semibold transition-all flex items-center gap-2 ${
                    mode === "weak"
                      ? "bg-[#E85A4F] text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  Luyện từ yếu
                </button>
              </div>

              <div className="flex gap-2 mb-5">
                {[10, 15, 20].map((num) => (
                  <button
                    key={num}
                    onClick={() => setQuestionCount(num)}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                      questionCount === num
                        ? "bg-[#E85A4F] text-white shadow-sm"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {num} câu
                  </button>
                ))}
              </div>
              <p className="text-gray-400 text-xs mb-6">
                {mode === "smart"
                  ? `Có ${dueWords.length} từ vựng đã đến lịch cần ôn tập`
                  : `Có ${dueWords.length} từ yếu cần luyện tập`}
              </p>
              <button
                onClick={handleStart}
                className="w-full py-3.5 bg-[#E85A4F] hover:bg-[#d94a3f] text-white font-bold rounded-xl text-base shadow-sm transition-all"
              >
                BẮT ĐẦU ÔN TẬP
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
    <div className="min-h-screen bg-[#FAF9F8] font-sans pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="px-6 py-4 flex items-center gap-4 max-w-2xl mx-auto">
          <button onClick={() => navigate("/flashcard")} className="p-2 rounded-full hover:bg-gray-100">
            <ChevronLeft className="w-5 h-5 text-[#474747]" />
          </button>
          <h1 className="text-xl font-black text-[#474747]">
            {mode === "smart" ? "Ôn tập thông minh" : "Luyện từ yếu"}
          </h1>
          <div className="flex-1"></div>
          <button
            onClick={handleSkip}
            disabled={!!showFeedback}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
          >
            Bỏ qua <FastForward className="w-3 h-3 inline ml-1" />
          </button>
        </div>
      </header>

      <main className="px-6 max-w-2xl mx-auto py-6">
        <div className="mb-6">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#E85A4F] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>Câu {currentIndex + 1}/{questions.length}</span>
            <span>Đã trả lời: {userAnswers.filter((a) => a).length}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-[#E0E0E0] p-6">
          <h2 className="text-xl font-bold text-[#474747] mb-6 text-center">
            {currentQ.type === "mcq" ? "Chọn đáp án đúng" : "Nhập nghĩa của từ"}
          </h2>

          <div className="text-center mb-8">
            <div className="text-7xl font-black text-[#E85A4F] mb-2">{currentQ.word}</div>
            {currentQ.reading && <div className="text-base text-gray-400 font-medium">〔 {currentQ.reading} 〕</div>}
            <button
              onClick={() => playAudio(currentQ.audioUrl)}
              className="mt-3 p-2 rounded-full bg-white shadow-sm border border-gray-200 hover:bg-gray-50 inline-flex items-center gap-1 text-sm text-gray-600"
            >
              <Volume2 className="w-4 h-4" /> Nghe
            </button>
          </div>

          {currentQ.image && (
            <div className="mb-6 flex justify-center">
              <img src={currentQ.image} alt="Hint" className="h-28 object-contain rounded-xl border border-gray-100 shadow-sm" />
            </div>
          )}

          <div className="space-y-3">
            {currentQ.type === "mcq" ? (
              currentQ.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (showFeedback) return;
                    setSelectedOption(opt);
                    handleAnswer(opt === currentQ.correctMeaning, opt);
                  }}
                  className={`w-full text-left px-5 py-3.5 rounded-xl border transition-all ${
                    selectedOption === opt
                      ? "border-[#E85A4F] bg-red-50 text-[#E85A4F] font-semibold"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="relative">
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
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E85A4F]/20 focus:border-[#E85A4F] bg-gray-50/50 text-base"
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#E85A4F] hover:bg-[#d94a3f] text-white rounded-lg transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {showFeedback && (
            <div
              className={`mt-6 p-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${
                showFeedback.ok
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {showFeedback.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>{showFeedback.msg}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SmartReviewPage;