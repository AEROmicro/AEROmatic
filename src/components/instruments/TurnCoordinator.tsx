"use client";
import React from "react";

interface Props {
  bank: number;    // degrees – positive = right bank (from turn rate)
  slip: number;    // ball slip –1 to +1 (lateral accel estimate)
  darkMode: boolean;
}

const CX = 150, CY = 150;

export default function TurnCoordinator({ bank, slip, darkMode }: Props) {
  // Aircraft silhouette banks by the bank angle
  const planeRotation = Math.min(Math.max(bank, -30), 30);

  // Inclinometer ball (at bottom)
  const BALL_TRACK_W = 60;
  const ballX = CX + Math.min(Math.max(slip, -1), 1) * (BALL_TRACK_W / 2);
  const ballY = CY + 95;

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full" aria-label={`Turn coordinator: bank ${bank.toFixed(0)}°`}>
      <defs>
        <radialGradient id="tc-bezel" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor={darkMode ? "#2a2a2a" : "#909090"} />
          <stop offset="100%" stopColor={darkMode ? "#111" : "#555"} />
        </radialGradient>
        <clipPath id="tc-clip"><circle cx={CX} cy={CY} r={135} /></clipPath>
      </defs>

      {/* Bezel */}
      <circle cx={CX} cy={CY} r={148} fill="url(#tc-bezel)" />
      <circle cx={CX} cy={CY} r={148} fill="none" stroke={darkMode ? "#444" : "#aaa"} strokeWidth="3" />

      {/* Face */}
      <circle cx={CX} cy={CY} r={140} fill="#000" />

      {/* Rate marks — L and R tick lines at ±20° (standard rate) */}
      {[[-20, "L"], [20, "R"]].map(([angle, label]) => {
        const ang = Number(angle);
        const x1L = CX + Math.sin((ang * Math.PI) / 180) * 110;
        const y1L = CY - Math.cos((ang * Math.PI) / 180) * 110;
        const x2L = CX + Math.sin((ang * Math.PI) / 180) * 126;
        const y2L = CY - Math.cos((ang * Math.PI) / 180) * 126;
        const tx = CX + Math.sin((ang * Math.PI) / 180) * 96;
        const ty = CY - Math.cos((ang * Math.PI) / 180) * 96;
        return (
          <g key={String(label)}>
            <line x1={x1L} y1={y1L} x2={x2L} y2={y2L} stroke="white" strokeWidth="2.5" />
            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central"
              fill="white" fontSize="16" fontFamily="Arial,sans-serif" fontWeight="bold">
              {String(label)}
            </text>
          </g>
        );
      })}

      {/* Center tick */}
      <line x1={CX} y1={CY - 110} x2={CX} y2={CY - 126} stroke="white" strokeWidth="2.5" />

      {/* Miniature aircraft (rotates with bank) */}
      <g transform={`rotate(${planeRotation}, ${CX}, ${CY - 20})`}>
        {/* Left wing */}
        <rect x={CX - 68} y={CY - 23} width="58" height="8" rx="3" fill="white" />
        {/* Right wing */}
        <rect x={CX + 10} y={CY - 23} width="58" height="8" rx="3" fill="white" />
        {/* Fuselage */}
        <rect x={CX - 5} y={CY - 52} width="10" height="60" rx="4" fill="white" />
        {/* Nose dot */}
        <circle cx={CX} cy={CY - 52} r={6} fill="white" />
      </g>

      {/* "2 MIN TURN" label */}
      <text x={CX} y={CY + 45} textAnchor="middle" fill="white" fontSize="10"
        fontFamily="Arial,sans-serif" opacity={0.7} letterSpacing="1">2 MIN TURN</text>
      <text x={CX} y={CY + 57} textAnchor="middle" fill="white" fontSize="9"
        fontFamily="Arial,sans-serif" opacity={0.5}>NO PITCH INFO</text>

      {/* Inclinometer (ball) */}
      <rect x={CX - 36} y={CY + 82} width="72" height="24" rx="12"
        fill="#111" stroke="#555" strokeWidth="1.5" />
      {/* Center tick marks */}
      <line x1={CX} y1={CY + 82} x2={CX} y2={CY + 86} stroke="white" strokeWidth="1.5" />
      <line x1={CX - 12} y1={CY + 82} x2={CX - 12} y2={CY + 86} stroke="white" strokeWidth="1" opacity={0.5} />
      <line x1={CX + 12} y1={CY + 82} x2={CX + 12} y2={CY + 86} stroke="white" strokeWidth="1" opacity={0.5} />
      {/* Ball */}
      <circle cx={ballX} cy={ballY} r={9} fill={darkMode ? "#ddd" : "#bbb"} stroke="#888" strokeWidth="1.5" />

      {/* Outer ring */}
      <circle cx={CX} cy={CY} r={130} fill="none" stroke={darkMode ? "#555" : "#888"} strokeWidth="1" />
    </svg>
  );
}
