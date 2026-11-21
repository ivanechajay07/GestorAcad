import React from 'react';

export const StudyIllustration: React.FC = () => (
  <svg className="study-ill" viewBox="0 0 640 420" role="img" aria-label="Ilustración del portal académico">
    <defs>
      <linearGradient id="illBar" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
      <linearGradient id="illHeader" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#eef2ff" />
        <stop offset="100%" stopColor="#e0e7ff" />
      </linearGradient>
    </defs>

    {/* fondo */}
    <circle cx="320" cy="210" r="190" fill="#eef2ff" />
    <circle cx="320" cy="210" r="145" fill="#e0e7ff" opacity="0.6" />
    <circle cx="522" cy="112" r="58" fill="#e0e7ff" opacity="0.5" />
    <circle cx="108" cy="330" r="48" fill="#e0e7ff" opacity="0.5" />

    {/* ventana principal */}
    <g className="ill-window">
      <rect x="150" y="90" width="340" height="240" rx="18" fill="#ffffff" stroke="#e0e7ff" strokeWidth="2" />
      <rect x="150" y="90" width="340" height="40" rx="18" fill="url(#illHeader)" />
      <rect x="150" y="112" width="340" height="18" fill="url(#illHeader)" />
      <circle cx="172" cy="110" r="5" fill="#f87171" />
      <circle cx="190" cy="110" r="5" fill="#fbbf24" />
      <circle cx="208" cy="110" r="5" fill="#34d399" />
      <rect x="252" y="102" width="176" height="16" rx="8" fill="#ffffff" />

      {/* sidebar */}
      <rect x="150" y="130" width="64" height="200" fill="#f8fafc" />
      <rect x="164" y="146" width="36" height="8" rx="4" fill="#c7d2fe" />
      <rect x="164" y="164" width="30" height="8" rx="4" fill="#e0e7ff" />
      <rect x="164" y="182" width="34" height="8" rx="4" fill="#e0e7ff" />
      <rect x="164" y="200" width="26" height="8" rx="4" fill="#e0e7ff" />

      {/* tiles */}
      <rect x="228" y="146" width="110" height="48" rx="10" fill="#eef2ff" />
      <rect x="352" y="146" width="120" height="48" rx="10" fill="#eef2ff" />
      <rect x="240" y="158" width="40" height="8" rx="4" fill="#c7d2fe" />
      <rect x="240" y="172" width="62" height="12" rx="4" fill="#6366f1" />
      <rect x="364" y="158" width="40" height="8" rx="4" fill="#c7d2fe" />
      <rect x="364" y="172" width="50" height="12" rx="4" fill="#06b6d4" />

      {/* barras */}
      <rect className="ill-bar b1" x="240" y="250" width="18" height="40" rx="4" fill="url(#illBar)" />
      <rect className="ill-bar b2" x="272" y="234" width="18" height="56" rx="4" fill="url(#illBar)" />
      <rect className="ill-bar b3" x="304" y="216" width="18" height="74" rx="4" fill="url(#illBar)" />
      <rect className="ill-bar b4" x="336" y="228" width="18" height="62" rx="4" fill="url(#illBar)" />
      <rect className="ill-bar b5" x="368" y="200" width="18" height="90" rx="4" fill="url(#illBar)" />

      {/* línea */}
      <polyline
        className="ill-line"
        points="400,290 420,268 440,278 460,238 484,252"
        fill="none"
        stroke="#06b6d4"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle className="ill-pulse" cx="484" cy="252" r="5" fill="#06b6d4" />
    </g>

    {/* tarjetas flotantes */}
    <g className="ill-float f1">
      <rect x="78" y="70" width="132" height="72" rx="14" fill="#ffffff" stroke="#e0e7ff" strokeWidth="2" />
      <rect x="94" y="86" width="52" height="8" rx="4" fill="#c7d2fe" />
      <rect x="94" y="102" width="92" height="14" rx="4" fill="#6366f1" />
      <rect x="94" y="122" width="42" height="6" rx="3" fill="#e0e7ff" />
    </g>

    <g className="ill-float f2">
      <circle cx="520" cy="88" r="34" fill="#ffffff" stroke="#e0e7ff" strokeWidth="2" />
      <circle cx="520" cy="80" r="11" fill="#f6c9a0" />
      <path d="M504 106 a16 16 0 0 1 32 0 z" fill="#4f46e5" />
    </g>

    <g className="ill-float f3">
      <rect x="468" y="300" width="152" height="66" rx="14" fill="#ffffff" stroke="#e0e7ff" strokeWidth="2" />
      <circle cx="494" cy="326" r="12" fill="#34d399" />
      <rect x="514" y="316" width="82" height="8" rx="4" fill="#c7d2fe" />
      <rect x="514" y="332" width="56" height="8" rx="4" fill="#e0e7ff" />
    </g>

    <g className="ill-float f4">
      <circle cx="94" cy="252" r="30" fill="#ffffff" stroke="#e0e7ff" strokeWidth="2" />
      <path d="M82 252 l8 8 l16 -16" fill="none" stroke="#34d399" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);
