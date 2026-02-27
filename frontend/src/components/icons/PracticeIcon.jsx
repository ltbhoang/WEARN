import React from 'react';

const PracticeIcon = ({ size = 120, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <style>
      {`
        @keyframes floating {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
          100% { transform: translateY(0px); }
        }
        @keyframes sparkleAnim {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes drift {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(2px, -2px); }
        }
        .float-group { animation: floating 4s ease-in-out infinite; }
        .sparkle-slow { animation: sparkleAnim 3s ease-in-out infinite; }
        .sparkle-fast { animation: sparkleAnim 2s ease-in-out infinite; }
        .drift-slow { animation: drift 5s ease-in-out infinite; }
      `}
    </style>
    <defs>
      <radialGradient id="practiceGlow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor="#A5A58D" stopOpacity="0.4" />
        <stop offset="70%" stopColor="#8E8D8A" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#8E8D8A" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="cardMainGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#FFF0F0" />
      </linearGradient>
      <filter id="softShadow" x="-0.02" y="-0.02" width="1.04" height="1.04">
        <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.08" />
      </filter>
      <filter id="glow" x="-0.1" y="-0.1" width="1.2" height="1.2">
        <feGaussianBlur stdDeviation="1" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Lớp nền glow */}
    <circle cx="60" cy="55" r="45" fill="url(#practiceGlow)" className="drift-slow" />

    {/* Nhóm các thẻ bài - Floating cùng nhau */}
    <g className="float-group">
      {/* Thẻ phía sau cùng */}
      <g filter="url(#softShadow)">
        <rect x="20" y="35" width="40" height="52" rx="12" fill="white" stroke="#A5A58D" strokeWidth="1.5" strokeOpacity="0.3" transform="rotate(-12 20 35)" />
      </g>

      {/* Thẻ phía sau */}
      <g filter="url(#softShadow)">
        <rect x="30" y="28" width="42" height="54" rx="12" fill="white" stroke="#A5A58D" strokeWidth="1.8" strokeOpacity="0.4" transform="rotate(-5 30 28)" />
      </g>

      {/* Thẻ chính giữa */}
      <g filter="url(#softShadow)">
        <rect x="38" y="18" width="50" height="60" rx="16" fill="url(#cardMainGradient)" stroke="#E85A4F" strokeWidth="3" />
        <rect x="46" y="26" width="34" height="28" rx="8" fill="#FFF5F5" stroke="#E85A4F" strokeWidth="1.5" strokeOpacity="0.4" />
        <circle cx="63" cy="40" r="8" fill="#E85A4F" fillOpacity="0.12" stroke="#E85A4F" strokeWidth="1.5" />
        <path d="M63 35 L63 45 M58 40 L68 40" stroke="#E85A4F" strokeWidth="2" strokeLinecap="round" />
        <text x="70" y="38" fontSize="9" fill="#E85A4F" fontWeight="bold" opacity="0.8">A+</text>
      </g>

      {/* Thẻ phía trước */}
      <g filter="url(#softShadow)">
        <rect x="60" y="30" width="38" height="50" rx="12" fill="white" stroke="#E85A4F" strokeWidth="2" strokeOpacity="0.6" transform="rotate(10 60 30)" />
      </g>
    </g>

    {/* Hệ thống các ngôi sao và tia sáng chuyển động */}
    <g>
      {/* Sao vàng lớn */}
      <circle cx="35" cy="25" r="3" fill="#FFD966" className="sparkle-slow" style={{ transformOrigin: '35px 25px' }} />
      <circle cx="95" cy="28" r="2.5" fill="#FFB347" className="sparkle-fast" style={{ transformOrigin: '95px 28px' }} />
      <circle cx="28" cy="82" r="2.8" fill="#FFD966" className="sparkle-slow" style={{ transformOrigin: '28px 82px' }} />
      <circle cx="88" cy="80" r="2.2" fill="#FFB347" className="sparkle-fast" style={{ transformOrigin: '88px 80px' }} />
      
      {/* Đốm sáng trắng li ti */}
      <circle cx="45" cy="45" r="1.2" fill="white" className="sparkle-fast" style={{ transformOrigin: '45px 45px' }} />
      <circle cx="75" cy="35" r="1" fill="white" className="sparkle-slow" style={{ transformOrigin: '75px 35px' }} />
      <circle cx="105" cy="50" r="2" fill="#FFB347" className="sparkle-slow" style={{ transformOrigin: '105px 50px' }} />
      <circle cx="20" cy="70" r="1" fill="#FFD966" className="sparkle-fast" style={{ transformOrigin: '20px 70px' }} />
    </g>
  </svg>
);

export default PracticeIcon;