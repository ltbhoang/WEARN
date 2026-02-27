import React, { useState, useEffect, useRef } from "react";

export default function Home() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState(null);

  // Action Chain state (giữ nguyên)
  const [pathData, setPathData] = useState("");
  const timelineRef = useRef(null);
  const phase1Ref = useRef(null);
  const phase2Ref = useRef(null);
  const phase3Ref = useRef(null);

  // --- 1. SỬA LOGIC TÍNH ĐƯỜNG CONG QUẸO (Cubic Bezier) ---
  const computeCurvedPath = (points) => {
    if (points.length < 3) return "";
    const [p1, p2, p3] = points;

    // Tạo các điểm điều hướng để đường cong uốn lượn mượt mà
    const cp1x = p1.x;
    const cp1y = p1.y + (p2.y - p1.y) * 1.2;
    const cp2x = p2.x;
    const cp2y = p1.y + (p2.y - p1.y) * 0.5;

    const cp3x = p2.x;
    const cp3y = p2.y + (p3.y - p2.y) * 0.5;
    const cp4x = p3.x;
    const cp4y = p2.y + (p3.y - p2.y) * 0.05;

    return `M ${p1.x} ${p1.y} 
            C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}
            C ${cp3x} ${cp3y}, ${cp4x} ${cp4y}, ${p3.x} ${p3.y}`;
  };

  useEffect(() => {
    const updatePath = () => {
      if (
        !timelineRef.current ||
        !phase1Ref.current ||
        !phase2Ref.current ||
        !phase3Ref.current
      )
        return;

      const timelineRect = timelineRef.current.getBoundingClientRect();
      const getRelativePos = (el) => {
        const rect = el.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2 - timelineRect.left,
          y: rect.top + rect.height / 2 - timelineRect.top,
        };
      };

      const p1 = getRelativePos(phase1Ref.current);
      const p2 = getRelativePos(phase2Ref.current);
      const p3 = getRelativePos(phase3Ref.current);

      setPathData(computeCurvedPath([p1, p2, p3]));
    };

    updatePath();
    window.addEventListener("resize", updatePath);
    const observer = new ResizeObserver(updatePath);
    observer.observe(timelineRef.current);
    return () => {
      window.removeEventListener("resize", updatePath);
      observer.disconnect();
    };
  }, []);

  // Giả lập quét camera
  useEffect(() => {
    const analyzeImage = () => {
      setIsAnalyzing(true);
      setPrediction(null);
      setTimeout(() => {
        setIsAnalyzing(false);
        setPrediction({
          kanji: "椅子",
          furigana: "いす",
          meaning: "Cái ghế",
          confidence: "98.4%",
          imgUrl:
            "https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=500",
        });
      }, 3000);
    };
    const interval = setInterval(analyzeImage, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F8] text-slate-900 font-sans selection:bg-[#f8e2e0] overflow-x-hidden">
      {/* 2. HERO & IPHONE WITH STICKERS */}
      <section className="pt-20 pb-32 px-6 max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
        <div className="space-y-8 relative">
          <h1 className="text-6xl md:text-7xl font-black text-[#474747] leading-tight">
            Chụp ảnh <br />
            <span className="text-[#E85A4F]">Ghi nhớ ngay.</span>
          </h1>
          <p className="text-xl text-[#8E8D8A] font-medium max-w-md">
            <span className="font-bold text-[#474747]">Wearn</span> dùng AI nhận
            diện đồ vật, kèm{" "}
            <span className="text-[#E85A4F]">ngữ cảnh (Story Mini)</span> và{" "}
            <span className="text-[#E85A4F]">mẹo nhớ (Mnemonic)</span> giúp bạn
            học từ vựng tiếng Nhật một cách tự nhiên nhất.
          </p>
          <button className="bg-[#474747] text-white px-10 py-5 rounded-2xl font-black text-lg shadow-2xl hover:bg-[#E85A4F] transition-all">
            Thử bản Demo
          </button>
        </div>

        {/* IPHONE MOCKUP WITH STICKERS (giữ nguyên) */}
        <div className="relative flex justify-center">
          {/* Sticker cam xung quanh điện thoại */}
          <div className="absolute top-10 -left-10 bg-orange-100 p-4 rounded-2xl rotate-[-15deg] shadow-sm animate-bounce-slow z-30">
            <span className="text-3xl">📸</span>
          </div>
          <div className="absolute -bottom-4 -right-8 bg-[#D8C3A5] p-3 rounded-full rotate-12 shadow-lg z-30 border-4 border-white text-white font-bold text-sm">
            Learn!
          </div>
          <div className="absolute top-1/2 -right-8 bg-[#E98074] w-12 h-12 rounded-xl flex items-center justify-center rotate-45 animate-pulse z-0 opacity-40" />

          {/* iPhone Frame */}
          <div className="relative border-8 border-[#474747] rounded-[3.5rem] h-155 w-75 shadow-[0_50px_100px_-20px_rgba(232,90,79,0.3)] bg-[#474747] overflow-hidden z-20">
            <div className="absolute top-0 inset-x-0 h-7 bg-[#474747] z-50 flex justify-center">
              <div className="mt-2 w-20 h-4 bg-black rounded-full" />
            </div>

            <div className="relative h-full w-full bg-white rounded-[2.8rem] overflow-hidden">
              {/* Camera View */}
              <div className="absolute inset-0 bg-slate-200">
                <img
                  src="https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=500"
                  className="w-full h-full object-cover"
                  alt="Scan"
                />
              </div>

              {isAnalyzing && (
                <div className="absolute inset-0 z-30 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#D8C3A5]/40 backdrop-blur-[2px]" />
                  <div className="w-16 h-16 border-4 border-white border-t-[#E85A4F] rounded-full animate-spin" />
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-[#E85A4F] shadow-[0_0_20px_#E85A4F] animate-scan-laser" />
                </div>
              )}

              {prediction && !isAnalyzing && (
                <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl p-8 rounded-t-[2.5rem] shadow-2xl animate-slide-up-app z-40">
                  <div className="w-12 h-1 bg-[#D8C3A5] rounded-full mx-auto mb-8" />
                  <h4 className="text-4xl font-black text-[#474747]">
                    {prediction.kanji}
                  </h4>
                  <p className="text-[#E85A4F] font-bold text-xl mb-4">
                    {prediction.furigana}
                  </p>
                  <p className="text-lg font-black text-[#474747] py-4 border-t border-gray-100">
                    {prediction.meaning}
                  </p>
                  <button className="w-full py-4 bg-[#E85A4F] text-white font-black rounded-xl">
                    Lưu Flashcard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. FLASHCARD SECTION (Chữ -> Click -> Hình) */}
      <section className="py-24 bg-[#474747] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          <div className="text-white space-y-6">
            <h2 className="text-5xl font-black italic tracking-tighter">
              Flashcard <br />
              Thế hệ mới
            </h2>
            <p className="text-lg text-[#D8C3A5] font-medium">
              Mỗi thẻ đều có hình ảnh thực tế bạn đã chụp, kèm mẹo nhỏ giúp bạn
              nhớ lâu hơn.
            </p>
          </div>

          <div className="relative flex justify-center">
            {/* Sticker trang trí quanh Card */}
            <div className="absolute -top-6 -right-6 text-4xl animate-bounce">
              ✨
            </div>

            {/* THE FLASHCARD: Chữ (Front) - Hình (Back) */}
            <div
              className="w-full max-w-85 aspect-3/4 cursor-pointer perspective-1000 group"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div
                className={`relative w-full h-full transition-all duration-800 transform-style-3d ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
              >
                {/* MẶT TRƯỚC: Thông tin từ vựng + Mẹo nhớ */}
                <div className="absolute inset-0 bg-[#FAF9F8] rounded-[3rem] flex flex-col items-center justify-center p-10 backface-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border-b-8 border-[#D8C3A5]">
                  <div className="mb-10 px-4 py-1 bg-[#f8e2e0] text-[#E85A4F] rounded-full text-[10px] font-black uppercase tracking-widest">
                    Từ vựng đã lưu
                  </div>
                  <h3 className="text-7xl font-black text-[#474747] tracking-tighter">
                    椅子
                  </h3>
                  <p className="text-2xl text-[#E98074] font-bold mt-4 italic">
                    いす (Isu)
                  </p>
                  <div className="mt-12 py-3 px-8 bg-[#474747] text-white rounded-2xl font-black text-xl">
                    Cái Ghế
                  </div>
                  {/* Mẹo nhớ ngay trên thẻ */}
                  <div className="mt-6 flex items-center gap-2 text-sm bg-[#D8C3A5]/10 px-4 py-2 rounded-full">
                    <span className="text-[#E85A4F] text-base">🧠</span>
                    <span className="text-[#474747] italic">
                      Mẹo: "Isu" – giống "ế sụ", nghĩ tới ghế êm ái không ai
                      mua?
                    </span>
                  </div>
                  <p className="mt-12 text-[11px] font-bold text-[#D8C3A5] uppercase tracking-widest animate-pulse">
                    Chạm để xem hình ảnh
                  </p>
                </div>

                {/* MẶT SAU: Hình ảnh thực tế */}
                <div className="absolute inset-0 bg-[#E85A4F] rounded-[3rem] overflow-hidden rotate-y-180 backface-hidden shadow-2xl border-4 border-white">
                  <img
                    src="https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=500"
                    className="w-full h-full object-cover"
                    alt="Real object"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute bottom-8 inset-x-0 text-center">
                    <span className="bg-white/90 backdrop-blur px-6 py-2 rounded-full font-black text-[#E85A4F] shadow-lg">
                      Hình ảnh bạn đã quét
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. STORY MODE (cải tiến từ Action Chain) */}
      <section
        id="story"
        className="py-24 px-4 bg-white overflow-visible relative"
      >
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#E85A4F]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-lg mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-[#474747] tracking-tighter">
              Story <span className="text-[#E98074]">Mode.</span>
            </h2>
            <p className="text-lg text-[#8E8D8A] mt-2 max-w-md mx-auto">
              AI ghép các từ vựng bạn đã học thành một câu chuyện ngắn, giúp ghi nhớ theo ngữ cảnh.
            </p>
          </div>

          <div className="relative" ref={timelineRef}>
            {/* SVG Layer */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ overflow: "visible" }}
            >
              <defs>
                <marker
                  id="arrowhead-red"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#D8C3A5" />
                </marker>
              </defs>
              <path
                d={pathData}
                stroke="#D8C3A5"
                strokeWidth="3"
                strokeDasharray="8 8"
                fill="none"
                markerEnd="url(#arrowhead-red)"
                className="animate-dash-flow"
              />
            </svg>

            {/* PHASE 1 - Căn trái */}
            <div className="relative flex justify-start mb-24">
              <div className="flex items-start gap-4 w-[90%] max-w-[320px]">
                <div
                  ref={phase1Ref}
                  className="z-10 w-14 h-14 bg-white rounded-2xl border border-gray-100 shadow-xl flex items-center justify-center text-2xl shrink-0"
                >
                  📸
                </div>
                <div className="flex-1 bg-[#FAF9F8] p-4 rounded-2xl border border-gray-100 shadow-sm min-h-27.5 flex flex-col justify-center">
                  <span className="text-[9px] font-black text-[#E85A4F] uppercase tracking-widest mb-1">
                    Phase 01
                  </span>
                  <h3 className="text-xl font-black text-[#474747] leading-none">
                    椅子を<span className="text-[#E85A4F]">見る</span>
                  </h3>
                  <p className="text-[10px] font-bold text-[#D8C3A5] italic mb-2">
                    いすをみる
                  </p>
                  <div className="h-px w-8 bg-gray-200 mb-2" />
                  <p className="text-xs text-[#8E8D8A] font-medium leading-tight">
                    Nhìn thấy <br /> chiếc ghế
                  </p>
                </div>
              </div>
            </div>

            {/* PHASE 2 - Căn phải (Nổi bật) */}
            <div className="relative flex justify-end mb-24">
              <div className="flex items-start gap-4 flex-row-reverse w-[90%] max-w-[320px]">
                <div
                  ref={phase2Ref}
                  className="z-10 w-14 h-14 bg-[#E85A4F] rounded-2xl border-2 border-white shadow-2xl flex items-center justify-center text-2xl shrink-0"
                >
                  🪑
                </div>
                <div className="flex-1 bg-white p-4 rounded-2xl border-2 border-[#E85A4F] shadow-lg min-h-27.5 flex flex-col justify-center text-right items-end">
                  <span className="text-[9px] font-black text-[#E85A4F] uppercase tracking-widest mb-1">
                    Phase 02 • Must Learn
                  </span>
                  <h3 className="text-xl font-black text-[#474747] leading-none">
                    椅子に<span className="text-[#E85A4F]">座る</span>
                  </h3>
                  <p className="text-[10px] font-bold text-[#E98074] italic mb-2">
                    いすにすわる
                  </p>
                  <div className="h-px w-8 bg-[#E85A4F]/20 mb-2" />
                  <p className="text-xs text-[#474747] font-bold leading-tight">
                    Ngồi xuống <br /> chiếc ghế
                  </p>
                </div>
              </div>
            </div>

            {/* PHASE 3 - Căn trái */}
            <div className="relative flex justify-start">
              <div className="flex items-start gap-4 w-[90%] max-w-[320px]">
                <div
                  ref={phase3Ref}
                  className="z-10 w-14 h-14 bg-white rounded-2xl border border-gray-100 shadow-xl flex items-center justify-center text-2xl shrink-0"
                >
                  🚶‍♂️
                </div>
                <div className="flex-1 bg-[#FAF9F8] p-4 rounded-2xl border border-gray-100 shadow-sm min-h-27.5 flex flex-col justify-center">
                  <span className="text-[9px] font-black text-[#E85A4F] uppercase tracking-widest mb-1">
                    Phase 03
                  </span>
                  <h3 className="text-xl font-black text-[#474747] leading-none">
                    椅子から<span className="text-[#E85A4F]">立つ</span>
                  </h3>
                  <p className="text-[10px] font-bold text-[#D8C3A5] italic mb-2">
                    いすからたつ
                  </p>
                  <div className="h-px w-8 bg-gray-200 mb-2" />
                  <p className="text-xs text-[#8E8D8A] font-medium leading-tight">
                    Rời khỏi <br /> chiếc ghế
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. GỢI Ý TỪ LIÊN QUAN (Related Words) */}
      <section className="py-24 px-6 bg-[#FAF9F8]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-[#474747] tracking-tighter">
              Từ vựng <span className="text-[#E85A4F]">liên quan</span>
            </h2>
            <p className="text-lg text-[#8E8D8A] mt-2 max-w-2xl mx-auto">
              Sau khi quét một vật, hệ thống sẽ gợi ý các từ cùng chủ đề giúp bạn mở rộng vốn từ nhanh chóng.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { kanji: "机", furigana: "つくえ", meaning: "Cái bàn", emoji: "🪑" },
              { kanji: "本", furigana: "ほん", meaning: "Quyển sách", emoji: "📚" },
              { kanji: "鉛筆", furigana: "えんぴつ", meaning: "Bút chì", emoji: "✏️" },
              { kanji: "消しゴム", furigana: "けしごむ", meaning: "Cục tẩy", emoji: "🧽" },
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
                <div className="text-3xl mb-3">{item.emoji}</div>
                <div className="text-2xl font-black text-[#474747]">{item.kanji}</div>
                <div className="text-[#E98074] font-bold text-sm mt-1">{item.furigana}</div>
                <div className="h-px w-8 bg-gray-200 my-3" />
                <div className="text-[#8E8D8A] text-sm font-medium">{item.meaning}</div>
                <button className="mt-4 text-[#E85A4F] text-xs font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                  + Lưu flashcard
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. GAMIFICATION – STREAK & THÀNH TÍCH */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-[#474747] tracking-tighter">
              Duy trì <span className="text-[#E85A4F]">đà học tập</span>
            </h2>
            <p className="text-lg text-[#8E8D8A] mt-2 max-w-2xl mx-auto">
              Tích lũy Streak mỗi ngày, nhận huy hiệu và phần thưởng khi đạt cột mốc.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-16">
            {/* Streak Calendar đơn giản */}
            <div className="bg-[#FAF9F8] p-8 rounded-4xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🔥</span>
                <span className="text-4xl font-black text-[#E85A4F]">12</span>
                <span className="text-[#474747] font-bold">ngày liên tiếp</span>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {[...Array(28)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                      ${i < 12 ? 'bg-[#E85A4F] text-white' : 'bg-gray-100 text-gray-400'}`}
                  >
                    {i+1}
                  </div>
                ))}
              </div>
              <p className="text-sm text-[#8E8D8A] mt-6 text-center">
                Streak 100 ngày nhận huy hiệu đặc biệt 🏆
              </p>
            </div>

            {/* Thành tích */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-[#FAF9F8] p-4 rounded-2xl">
                <div className="w-10 h-10 bg-[#D8C3A5] rounded-xl flex items-center justify-center text-xl">🎖️</div>
                <div>
                  <div className="font-black text-[#474747]">Chiến binh 7 ngày</div>
                  <div className="text-sm text-[#8E8D8A]">Đã đạt 7 ngày Streak</div>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-[#FAF9F8] p-4 rounded-2xl">
                <div className="w-10 h-10 bg-[#E98074] rounded-xl flex items-center justify-center text-xl">📸</div>
                <div>
                  <div className="font-black text-[#474747]">Thợ săn từ vựng</div>
                  <div className="text-sm text-[#8E8D8A]">Đã quét 50 đồ vật</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 px-6 bg-[#FAF9F8] border-t border-gray-100 flex flex-col items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#E85A4F] rounded-lg flex items-center justify-center">
            <span className="text-white font-black italic text-sm">W</span>
          </div>
          <span className="text-lg font-black text-[#E85A4F] tracking-tighter italic uppercase">
            Wearn
          </span>
        </div>
        <p className="text-xs text-[#8E8D8A] font-bold tracking-[0.3em] uppercase underline decoration-[#D8C3A5] decoration-2">
          Watch & Learn Project
        </p>
      </footer>
    </div>
  );
}