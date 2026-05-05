"use client";
import React from "react";

interface Props {
  pitch: number;   // degrees – positive = nose up
  bank: number;    // degrees – positive = right bank
  darkMode: boolean;
}

const CX = 150, CY = 150;
const PPD = 3.8; // pixels per degree of pitch

export default function AttitudeIndicator({ pitch, bank, darkMode }: Props) {
  const pitchOffset = pitch * PPD;  // positive pitch → horizon moves down (more sky)
  const horizonY = CY + pitchOffset;

  // Pitch ladder lines: draw marks for -30..+30 in 5° steps
  const pitchMarks: React.ReactNode[] = [];
  for (let deg = -30; deg <= 30; deg += 5) {
    if (deg === 0) continue;
    const y = horizonY - deg * PPD;
    const isAbove = deg > 0;
    const major = Math.abs(deg) % 10 === 0;
    const hw = major ? 36 : 22; // half-width of line
    pitchMarks.push(
      <g key={deg}>
        <line x1={CX - hw} y1={y} x2={CX + hw} y2={y}
          stroke="white" strokeWidth={major ? 1.5 : 1} opacity={0.9} />
        {major && (
          <>
            <text x={CX - hw - 6} y={y} fill="white" fontSize="10"
              textAnchor="end" dominantBaseline="central" fontFamily="Arial,sans-serif">
              {Math.abs(deg)}
            </text>
            <text x={CX + hw + 6} y={y} fill="white" fontSize="10"
              textAnchor="start" dominantBaseline="central" fontFamily="Arial,sans-serif">
              {Math.abs(deg)}
            </text>
          </>
        )}
        {/* Chevron-down indicators for descent reference */}
        {!isAbove && major && (
          <>
            <line x1={CX - hw} y1={y} x2={CX - hw} y2={y + 6}
              stroke="white" strokeWidth={1.5} />
            <line x1={CX + hw} y1={y} x2={CX + hw} y2={y + 6}
              stroke="white" strokeWidth={1.5} />
          </>
        )}
      </g>
    );
  }

  // Bank angle scale (on outer bezel, fixed)
  const bankMarks: React.ReactNode[] = [];
  const bankAngles = [10, 20, 30, 45, 60];
  for (const angle of bankAngles) {
    for (const sign of [-1, 1]) {
      const bearing = 360 - angle * sign; // bearing from top, CW
      const rad = (bearing * Math.PI) / 180;
      const r1 = 133;
      const r2 = angle % 30 === 0 ? 122 : 127;
      const x1 = CX + r1 * Math.sin(rad);
      const y1 = CY - r1 * Math.cos(rad);
      const x2 = CX + r2 * Math.sin(rad);
      const y2 = CY - r2 * Math.cos(rad);
      bankMarks.push(
        <line key={`bm-${sign}-${angle}`} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="white" strokeWidth={angle % 30 === 0 ? 2 : 1.5} opacity={0.8} />
      );
    }
  }

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full" aria-label={`Attitude: pitch ${pitch.toFixed(1)}° bank ${bank.toFixed(1)}°`}>
      <defs>
        <clipPath id="ai-face-clip">
          <circle cx={CX} cy={CY} r={135} />
        </clipPath>
        <radialGradient id="ai-bezel" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor={darkMode ? "#2a2a2a" : "#909090"} />
          <stop offset="100%" stopColor={darkMode ? "#111" : "#555"} />
        </radialGradient>
      </defs>

      {/* Bezel */}
      <circle cx={CX} cy={CY} r={148} fill="url(#ai-bezel)" />
      <circle cx={CX} cy={CY} r={148} fill="none" stroke={darkMode ? "#444" : "#aaa"} strokeWidth="3" />

      {/* Sky / Ground sphere — rotated by bank, offset by pitch */}
      <g clipPath="url(#ai-face-clip)">
        <g transform={`rotate(${-bank}, ${CX}, ${CY})`}>
          {/* Sky */}
          <rect x="-500" y="-500" width="1100" height={horizonY + 500}
            fill={darkMode ? "#0D47A1" : "#1565C0"} />
          {/* Ground */}
          <rect x="-500" y={horizonY} width="1100" height="1100"
            fill={darkMode ? "#4E342E" : "#6D4C41"} />
          {/* Sky gradient at horizon */}
          <rect x="-500" y={horizonY - 4} width="1100" height="8"
            fill="white" opacity={0.5} />
          {/* Horizon line */}
          <line x1="-500" y1={horizonY} x2="1100" y2={horizonY}
            stroke="white" strokeWidth="2.5" />
          {/* Pitch ladder */}
          {pitchMarks}
          {/* Sky/Ground chevron marks */}
          <rect x={CX - 3} y={horizonY - 25} width="6" height="20"
            fill="white" opacity={0.7} rx="1" />
          <rect x={CX - 3} y={horizonY + 5} width="6" height="20"
            fill="white" opacity={0.7} rx="1" />
        </g>
      </g>

      {/* Bank angle tick marks (fixed) */}
      {bankMarks}

      {/* Bank pointer triangle (fixed at top, moves with bank) */}
      <g transform={`rotate(${-bank}, ${CX}, ${CY})`}>
        <polygon points={`${CX},${CY - 120} ${CX - 7},${CY - 108} ${CX + 7},${CY - 108}`}
          fill="white" opacity={0.9} />
      </g>
      {/* Fixed reference triangle at top */}
      <polygon points={`${CX},${CY - 133} ${CX - 6},${CY - 121} ${CX + 6},${CY - 121}`}
        fill="none" stroke="white" strokeWidth="1.5" />

      {/* Fixed aircraft symbol */}
      {/* Left wing */}
      <rect x={CX - 55} y={CY - 3} width={40} height={6} fill="#FFD700" rx="2" />
      {/* Right wing */}
      <rect x={CX + 15} y={CY - 3} width={40} height={6} fill="#FFD700" rx="2" />
      {/* Nose dot */}
      <circle cx={CX} cy={CY} r={5} fill="#FFD700" />
      {/* Fuselage */}
      <rect x={CX - 3} y={CY - 3} width={6} height={6} fill="#FFD700" rx="1" />

      {/* Outer bezel ring with bank scale labels */}
      <circle cx={CX} cy={CY} r={140} fill="none" stroke={darkMode ? "#555" : "#888"} strokeWidth="1" />

      {/* "ATT" label */}
      <text x={CX} y={CY + 115} textAnchor="middle" fill="white" fontSize="10"
        fontFamily="Arial,sans-serif" opacity={0.7} letterSpacing="2">
        ATT
      </text>
    </svg>
  );
}
