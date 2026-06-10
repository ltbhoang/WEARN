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

const SmartReviewPage = () => {
  const navigate = useNavigate();
  const { flashcardSets, updateFlashcardItemStatus } = useFlashcardStore();
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
  const [sm2Map, setSm2Map] = useState({});

  const slideTransition = {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 0.8
  };

  useEffect(() => {
    const stored = localStorage.getItem("smart_review_sm2_data");
    if (stored) {
      try {
        setSm2Map(JSON.parse(stored));
      } catch (e) {
        console.error("Lỗi parse dữ liệu SM-2", e);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (audioInstanceRef.current) {
        audioInstanceRef.current.pause();
        audioInstanceRef.current.src = "";
      }
    };
  }, []);

  const calculateSM2 = (quality, prevEF = 2.5, prevInterval = 0, prevRepetitions = 0) => {
    let ef = prevEF;
    let interval = 1;
    let repetitions = prevRepetitions;

    if (quality < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(prevInterval * ef);
      }
      repetitions++;
    }

    ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ef < 1.3) ef = 1.3;

    const nextReviewDate = Date.now() + interval * 24 * 60 * 60 * 1000;
    return { ef, interval, repetitions, nextReviewDate };
  };

  const handleSM2Update = (wordId, quality) => {
    setSm2Map(prev => {
      const currentWordData = prev[wordId] || { ef: 2.5, interval: 0, repetitions: 0 };
      const updatedData = calculateSM2(
        quality,
        currentWordData.ef,
        currentWordData.interval,
        currentWordData.repetitions
      );
      
      const newMap = { ...prev, [wordId]: updatedData };
      localStorage.setItem("smart_review_sm2_data", JSON.stringify(newMap));
      return newMap;
    });

    if (quality >= 4 && updateFlashcardItemStatus) {
      updateFlashcardItemStatus(wordId, true); 
    }
  };

  const generateQuestions = (sets) => {
    if (!sets || sets.length === 0) return [];

    const sortedSets = [...sets].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const latestSets = sortedSets.slice(0, 5);
    const allWords = [];

    for (const set of latestSets) {
      for (const item of set.items) {
        if (item.vocabulary_detail) {
          const sm2Info = sm2Map[item.id] || { nextReviewDate: 0, ef: 2.5 };
          allWords.push({
            id: item.id,
            word: item.vocabulary_detail.word,
            meaning: item.vocabulary_detail.meaning,
            reading: item.vocabulary_detail.reading_hiragana || item.vocabulary_detail.pronunciation,
            audioUrl: item.vocabulary_detail.audio_url,
            image: item.user_image || item.vocabulary_detail.image_url,
            memorized: item.memorized,
            nextReviewDate: sm2Info.nextReviewDate,
            ef: sm2Info.ef,
          });
        }
      }
    }

    if (allWords.length === 0) return [];

    allWords.sort((a, b) => {
      if (a.nextReviewDate !== b.nextReviewDate) return a.nextReviewDate - b.nextReviewDate;
      return a.ef - b.ef;
    });

    const selectedWords = allWords.slice(0, 10);
    const indices = Array.from({ length: selectedWords.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const essayIndices = new Set(indices.slice(0, 3));
    const mcqIndices = indices.slice(3, 10);

    const questionList = [];
    const allMeanings = allWords.map(w => w.meaning).filter(m => m);

    essayIndices.forEach(idx => {
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

    mcqIndices.forEach(idx => {
      const w = selectedWords[idx];
      if (w) {
        let wrongOptions = [];
        const otherMeanings = allMeanings.filter(m => m !== w.meaning);
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
    if (flashcardSets.length > 0 && questions.length === 0) {
      const qs = generateQuestions(flashcardSets);
      setQuestions(qs);
      setUserAnswers(new Array(qs.length).fill(null));
    }
    setLoading(false);
  }, [flashcardSets]);

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
      audio.play().catch(e => console.warn("Lỗi tự động phát âm thanh:", e));
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
      setCurrentIndex(prev => prev + 1);
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

    handleSM2Update(currentQ.id, qualityScore);

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

    handleSM2Update(currentQ.id, 1);
    moveToNextQuestion();
  };

  if (isFinished) {
    const total = userAnswers.length;
    const correctCount = userAnswers.filter(a => a && a.isCorrect).length;
    const accuracy = total ? Math.round((correctCount / total) * 100) : 0;
    return (
      <div className="fixed inset-0 bg-[#FDFDFD] flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="w-full max-w-md bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-xl shadow-gray-100/50"
        >
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-8xl mb-4">
            🏆
          </motion.div>
          <h1 className="text-3xl font-black text-gray-800 mb-1 tracking-tight">HOÀN THÀNH!</h1>
          <p className="text-gray-400 font-medium mb-8">Hệ thống SM-2 đã cập nhật lịch trình ôn tập của bạn</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-green-50/60 p-5 rounded-[2rem] border border-green-100/70 transition-all hover:scale-[1.02]">
              <CheckCircle2 className="w-7 h-7 text-green-500 mx-auto mb-2" />
              <div className="text-3xl font-black text-green-600">{correctCount}</div>
              <div className="text-xs font-bold text-green-500/80 uppercase tracking-wider">Đúng</div>
            </div>
            <div className="bg-red-50/60 p-5 rounded-[2rem] border border-red-100/70 transition-all hover:scale-[1.02]">
              <XCircle className="w-7 h-7 text-red-500 mx-auto mb-2" />
              <div className="text-3xl font-black text-red-600">{total - correctCount}</div>
              <div className="text-xs font-bold text-red-500/80 uppercase tracking-wider">Sai/Bỏ qua</div>
            </div>
          </div>

          <div className="mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Độ chính xác phiên này</span>
            <div className="text-5xl font-black text-[#FF6B6B]">{accuracy}%</div>
          </div>

          <div className="space-y-3">
            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.reload()} 
              className="w-full py-4 bg-[#FF6B6B] text-white rounded-[1.5rem] font-bold text-lg shadow-lg shadow-[#FF6B6B]/20 hover:bg-[#ff5757] transition-all"
            >
              TIẾP TỤC ÔN TẬP
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/flashcard")} 
              className="w-full py-4 text-gray-500 hover:text-gray-700 font-bold text-base flex items-center justify-center gap-2 transition-colors"
            >
              <Home className="w-5 h-5" /> VỀ TRANG CHÍNH
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!started) {
    if (loading || questions.length === 0) {
      return (
        <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-gray-100 border-t-[#FF6B6B]" />
          </div>
        </div>
      );
    }
    return (
      <div className="fixed inset-0 bg-[#FDFDFD] flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center max-w-sm w-full">
          <div className="w-40 h-40 rounded-full bg-red-50 flex items-center justify-center mb-8 shadow-inner border border-red-100 relative">
            <AnimatePresence mode="wait">
              {countdown === null ? (
                <motion.div key="play" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Play className="w-14 h-14 text-[#FF6B6B] fill-[#FF6B6B] ml-1" />
                </motion.div>
              ) : (
                <motion.span key={countdown} initial={{ scale: 0.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.8, opacity: 0 }} transition={{ duration: 0.3 }} className="text-6xl font-black text-[#FF6B6B] absolute">
                  {countdown === 0 ? "GO!" : countdown}
                </motion.span>
              )}
            </AnimatePresence>
            {countdown !== null && (
              <motion.div animate={{ scale: [1, 1.4], opacity: [0.3, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="absolute inset-0 bg-[#FF6B6B] rounded-full" />
            )}
          </div>
          <h1 className="text-2xl font-black text-gray-800 mb-2 uppercase tracking-tight">Thuật toán SM-2</h1>
          <p className="text-gray-500 font-medium text-sm mb-1">{questions.length} từ vựng cần kích hoạt lại trí nhớ</p>
          <p className="text-[#FF6B6B] font-bold text-xs bg-red-50 px-3 py-1 rounded-full mb-10 border border-red-100/50">Hệ thống tự động tính toán tần suất lặp lại ngắt quãng</p>
          
          {countdown === null && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }} 
              onClick={handleStart} 
              className="w-full py-4 bg-[#FF6B6B] text-white rounded-[1.5rem] font-bold text-lg shadow-xl shadow-[#FF6B6B]/20 hover:bg-[#ff5757] transition-all"
            >
              BẮT ĐẦU ÔN TẬP
            </motion.button>
          )}
        </motion.div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="fixed inset-0 bg-[#FDFDFD] flex flex-col font-sans select-none overflow-hidden">
      {/* Header & progress bar */}
      <div className="px-6 pt-10 pb-4 max-w-xl w-full mx-auto z-20 bg-[#FDFDFD]">
        <div className="flex items-center justify-between mb-4">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/flashcard")} 
            className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </motion.button>
          <div className="text-sm font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            Câu số: <span className="text-[#FF6B6B] font-black">{currentIndex + 1}</span>/{questions.length}
          </div>
          
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleSkip}
            disabled={!!showFeedback}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 transition-all ${
              !!showFeedback 
                ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" 
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            Bỏ qua <FastForward className="w-3.5 h-3.5" />
          </motion.button>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
          <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} className="h-full bg-gradient-to-r from-[#FF6B6B] to-[#FF9E7D]" />
        </div>
      </div>

      {/* Vùng Content chính */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-xl w-full mx-auto relative">
        
        {/* FIX 1: Thay đổi min-h thành h-[480px] hoặc một khoảng cố định an toàn cho cả MCQ và Essay nhằm tránh co giãn chiều dọc */}
        <div className="w-full relative overflow-hidden h-[480px]">
          {/* FIX 2: Đổi mode thành "wait" để component cũ biến mất hoàn toàn rồi component mới mới slide vào, tránh việc tranh chấp không gian layout */}
          <AnimatePresence mode="wait" initial={false}>
            {/* Đưa dòng comment ra hẳn bên ngoài thẻ mở JSX để tránh lỗi compile */}
            {/* FIX 3: Dùng w-full h-full flex flex-col items-center justify-center để khóa chặt form, không dùng absolute inset-x-0 khi ở mode="wait" nữa */}
            <motion.div 
              key={`question-${currentIndex}`}
              initial={{ opacity: 0, x: "100%" }} 
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "-100%" }}
              transition={slideTransition}
              className="w-full h-full flex flex-col items-center justify-start pt-4"
            >
              <div className="text-5xl font-black text-gray-800 mb-1 tracking-tight text-center">{currentQ.word}</div>
              
              {currentQ.reading && (
                <p className="text-base text-gray-400 font-medium mb-3 tracking-wide text-center">
                  〔 {currentQ.reading} 〕
                </p>
              )}

              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => playAudio(currentQ.audioUrl)} 
                className="mb-4 p-3 rounded-full bg-white shadow-md border border-gray-100 hover:bg-gray-50 transition-all text-[#FF6B6B]"
              >
                <Volume2 className="w-5 h-5 fill-current" />
              </motion.button>

              {currentQ.image && (
                <div className="mb-4 h-24 rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white p-1 shrink-0">
                  <img src={currentQ.image} alt="Hint" className="h-full object-contain rounded-lg" />
                </div>
              )}

              {/* Khối tương tác (MCQ / Essay) */}
              <div className="w-full mt-2">
                {currentQ.type === "mcq" ? (
                  <div className="w-full space-y-2.5">
                    {currentQ.options.map((opt, idx) => {
                      const isSelected = selectedOption === opt;
                      return (
                        <motion.button
                          key={`${currentIndex}-opt-${idx}`}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => {
                            if (showFeedback) return;
                            setSelectedOption(opt);
                            handleAnswer(opt === currentQ.correctMeaning, opt);
                          }}
                          className={`w-full text-left px-5 py-3.5 rounded-2xl border-2 font-bold text-base transition-all ${
                            isSelected
                              ? "border-[#FF6B6B] bg-red-50/50 text-[#FF6B6B] shadow-sm"
                              : "border-gray-100 bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50/30 shadow-sm shadow-gray-100/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-xs font-black border ${
                              isSelected ? "bg-[#FF6B6B] text-white border-[#FF6B6B]" : "bg-gray-50 text-gray-400 border-gray-200"
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="flex-1 truncate">{opt}</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="w-full bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={typedAnswer}
                        onChange={(e) => setTypedAnswer(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !showFeedback && handleAnswer(typedAnswer.trim().toLowerCase() === currentQ.correctMeaning.toLowerCase(), typedAnswer)}
                        placeholder="Nhập nghĩa tiếng Việt..."
                        className="w-full pl-4 pr-12 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/20 focus:border-[#FF6B6B] text-base bg-gray-50/50 font-medium transition-all"
                        autoFocus
                        disabled={!!showFeedback}
                      />
                      <button
                        onClick={() => !showFeedback && handleAnswer(typedAnswer.trim().toLowerCase() === currentQ.correctMeaning.toLowerCase(), typedAnswer)}
                        className="absolute right-2 p-2 bg-[#FF6B6B] hover:bg-[#ff5757] text-white rounded-lg transition-colors shadow-sm"
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

        {/* Khối chứa Feedback */}
        <div className="w-full min-h-[64px] mt-2 z-20">
          <AnimatePresence>
            {showFeedback && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={`w-full p-3.5 rounded-2xl text-sm font-bold shadow-sm flex items-center justify-center gap-2 border ${
                  showFeedback.ok 
                    ? "bg-green-50 border-green-100 text-green-700" 
                    : "bg-red-50 border-red-100 text-red-700"
                }`}
              >
                {showFeedback.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
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