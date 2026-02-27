import React from 'react';

const ScanHistoryIcon = ({ size = 120, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <style>
      {`
        @keyframes floating {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.5; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes lensGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .float { animation: floating 4s ease-in-out infinite; }
        .star { animation: sparkle 2.5s ease-in-out infinite; }
        .lens { animation: lensGlow 3s ease-in-out infinite; }
      `}
    </style>
    <defs>
      <radialGradient id="glowPink" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor="#E85A4F" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#E98074" stopOpacity="0.1" />
      </radialGradient>
      <linearGradient id="polaroidGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="white" />
        <stop offset="100%" stopColor="#FFF0F0" />
      </linearGradient>
      <filter id="softShadow" x="-0.02" y="-0.02" width="1.04" height="1.04">
        <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.1" />
      </filter>
    </defs>
    
    <circle cx="60" cy="55" r="45" fill="url(#glowPink)" />
    
    {/* Polaroid Group */}
    <g className="float">
      <g filter="url(#softShadow)">
        <rect x="22" y="26" width="52" height="52" rx="12" fill="#F5F5F5" stroke="#DDD" strokeWidth="1.5" />
        <rect x="26" y="30" width="44" height="36" rx="6" fill="white" stroke="#DDD" strokeWidth="1" />
        <path d="M36 50 L44 42 L52 50 L62 38 L70 48" stroke="#BBB" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </g>
      
      <g filter="url(#softShadow)">
        <rect x="38" y="12" width="54" height="54" rx="14" fill="url(#polaroidGradient)" stroke="#E85A4F" strokeWidth="3" />
        <rect x="42" y="16" width="46" height="38" rx="8" fill="#FFF9F9" stroke="#E85A4F" strokeWidth="1.5" strokeOpacity="0.4" />
        <path d="M56 30 L62 36 L68 30 L65 26 L62 28 L59 26 L56 30Z" fill="#E85A4F" fillOpacity="0.3" />
      </g>
    </g>
    
    {/* Magnifying glass - Floating faster */}
    <g className="float" style={{ animationDelay: '-1s' }} filter="url(#softShadow)">
      <circle cx="82" cy="58" r="16" fill="white" stroke="#E85A4F" strokeWidth="3" />
      <circle cx="82" cy="58" r="8" fill="url(#glowPink)" className="lens" />
      <path d="M95 72 L105 82" stroke="#E85A4F" strokeWidth="4" strokeLinecap="round" />
    </g>
    
    {/* Sparkles */}
    <circle className="star" cx="40" cy="20" r="2" fill="#FFD966" style={{ transformOrigin: '40px 20px' }} />
    <circle className="star" cx="90" cy="30" r="1.8" fill="#FFB347" style={{ transformOrigin: '90px 30px', animationDelay: '0.5s' }} />
    <circle className="star" cx="30" cy="80" r="1.5" fill="#FFD966" style={{ transformOrigin: '30px 80px', animationDelay: '1s' }} />
  </svg>
);

export default ScanHistoryIcon;