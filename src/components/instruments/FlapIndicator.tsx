"use client";
import React from "react";

interface Props {
  flapDeg: number;   // 0, 5, 10, 15, 20, 25, 30, 40
  darkMode: boolean;
}

// Boeing 737 NG flap settings
const POSITIONS = [0, 1, 2, 5, 10, 15, 25, 30, 40];

export default function FlapIndicator({ flapDeg, darkMode }: Props) {
  const angle = Math.min(Math.max(flapDeg, 0), 40);
  // Map 0–40° to a visual bar height (0–100%)
  const pct = (angle / 40) * 100;
  const barH = (pct / 100) * 170;
  const barY = 200 - barH;
  const color = angle === 0 ? "#4CAF50" : angle <= 15 ? "#8BC34A" : angle <= 30 ? "#FFC107" : "#FF7043";

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full" aria-label={`Flaps ${angle}°`}>
      <defs>
        <radialGradient id="flap-bezel" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor={darkMode ? "#2a2a2a" : "#909090"} />
          <stop offset="100%" stopColor={darkMode ? "#111" : "#555"} />
        </radialGradient>
      </defs>
      <circle cx={150} cy={150} r={148} fill="url(#flap-bezel)" />
      <circle cx={150} cy={150} r={148} fill="none" stroke={darkMode ? "#444" : "#aaa"} strokeWidth="3" />
      <circle cx={150} cy={150} r={140} fill="#000" />

      {/* Vertical scale */}
      <rect x={110} y={30} width={40} height={170} rx="4" fill="#111" stroke="#444" strokeWidth="1.5" />

      {/* Fill bar */}
      <rect x={112} y={barY} width={36} height={barH} rx="3" fill={color} opacity={0.85} />

      {/* Tick marks and labels */}
      {POSITIONS.map(pos => {
        const y = 200 - (pos / 40) * 170;
        return (
          <g key={pos}>
            <line x1={103} y1={y} x2={110} y2={y} stroke="white" strokeWidth="1.5" />
            <text x={95} y={y} textAnchor="end" dominantBaseline="central"
              fill="white" fontSize="11" fontFamily="Arial,sans-serif">
              {pos}
            </text>
          </g>
        );
      })}

      {/* Pointer */}
      <polygon
        points={`${152},${barY - 1} ${165},${barY - 6} ${165},${barY + 4}`}
        fill="white"
      />

      {/* Flap icon (simplified wing cross-section) */}
      <g transform="translate(190, 150)">
        <path d="M -30 0 Q 0 -10 30 0 Q 0 10 -30 0 Z" fill={color} opacity={0.9} />
        <path
          d={`M 10 0 Q 25 ${-5 - angle * 0.3} 38 ${-10 - angle * 0.5}`}
          fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
        />
      </g>

      <text x={150} y={228} textAnchor="middle" fill="white" fontSize="14"
        fontFamily="Arial,sans-serif" fontWeight="bold" letterSpacing="2">FLAPS</text>

      <rect x={116} y={240} width="68" height="22" rx="3"
        fill="#111" stroke="#444" strokeWidth="1" />
      <text x={150} y={255} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize="14" fontFamily="monospace" fontWeight="bold">
        {angle}°
      </text>
    </svg>
  );
}
