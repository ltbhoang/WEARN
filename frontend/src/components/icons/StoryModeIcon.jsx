import React from 'react';

const StoryModeIcon = ({ size = 120, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <style>
      {`
        @keyframes bookFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(1deg); }
        }
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.7); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes magicGlow {
          0%, 100% { filter: blur(2px); opacity: 0.5; }
          50% { filter: blur(4px); opacity: 0.8; }
        }
        .book-wing { animation: bookFloat 5s ease-in-out infinite; }
        .magic-star { animation: starTwinkle 3s ease-in-out infinite; }
        .inner-glow { animation: magicGlow 4s ease-in-out infinite; }
      `}
    </style>
    <defs>
      <radialGradient id="storyGlow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor="#E85A4F" stopOpacity="0.4" />
        <stop offset="70%" stopColor="#D8B4A0" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#D8B4A0" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="bookCover" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#FFF5F0" />
      </linearGradient>
      <filter id="softShadow" x="-0.1" y="-0.1" width="1.2" height="1.2">
        <feDropShadow dx="1" dy="3" stdDeviation="2" floodOpacity="0.1" />
      </filter>
    </defs>

    <circle cx="60" cy="60" r="45" fill="url(#storyGlow)" />

    {/* Floating Book Group */}
    <g className="book-wing" style={{ transformOrigin: 'center' }}>
      <g filter="url(#softShadow)">
        <path d="M30 30 L30 70 L60 60 L90 70 L90 30 L60 40 L30 30Z" fill="url(#bookCover)" stroke="#D8B4A0" strokeWidth="2.5" />
        <path d="M34 34 L34 64 L58 56 L58 42 L34 34Z" fill="#FFFDFA" stroke="#D8B4A0" strokeWidth="1" strokeOpacity="0.3" />
        <path d="M86 34 L86 64 L62 56 L62 42 L86 34Z" fill="#FFFDFA" stroke="#D8B4A0" strokeWidth="1" strokeOpacity="0.3" />
      </g>
      {/* Magic glow coming from book */}
      <circle cx="60" cy="50" r="10" fill="#E85A4F" fillOpacity="0.2" className="inner-glow" />
    </g>

    {/* Sparkles & Stars */}
    <g>
      <circle className="magic-star" cx="30" cy="25" r="3.5" fill="#FFD966" style={{ transformOrigin: '30px 25px' }} />
      <circle className="magic-star" cx="85" cy="22" r="3" fill="#FFD966" style={{ transformOrigin: '85px 22px', animationDelay: '0.7s' }} />
      <circle className="magic-star" cx="95" cy="78" r="2.8" fill="#FFB347" style={{ transformOrigin: '95px 78px', animationDelay: '1.2s' }} />
      <circle className="magic-star" cx="25" cy="80" r="3" fill="#FFD966" style={{ transformOrigin: '25px 80px', animationDelay: '0.3s' }} />
      
      {/* Tiny white sparkles */}
      <circle className="magic-star" cx="60" cy="20" r="1" fill="white" style={{ transformOrigin: '60px 20px', animationDelay: '1.5s' }} />
      <circle className="magic-star" cx="105" cy="55" r="1.2" fill="white" style={{ transformOrigin: '105px 55px', animationDelay: '0.5s' }} />
    </g>
  </svg>
);

export default StoryModeIcon;