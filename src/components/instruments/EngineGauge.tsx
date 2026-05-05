"use client";
import React from "react";
import { polar, arcPath, valueToBearing } from "./utils";

interface Props {
  value: number;       // 0-110 (percent)
  label: string;       // e.g. "N1" or "N2"
  unit?: string;       // e.g. "%" or "°C"
  min?: number;
  max?: number;
  greenStart?: number;
  greenEnd?: number;
  yellowStart?: number;
  yellowEnd?: number;
  redLine?: number;
  darkMode: boolean;
}

const CX = 150, CY = 150;
const START = 220;
const TOTAL = 240;

export default function EngineGauge({
  value,
  label,
  unit = "%",
  min = 0,
  max = 110,
  greenStart = 60,
  greenEnd = 100,
  yellowStart = 100,
  yellowEnd = 105,
  redLine = 105,
  darkMode,
}: Props) {
  const b = (v: number) => valueToBearing(v, min, max, START, TOTAL);
  const needleBearing = b(value);

  const ticks: React.ReactNode[] = [];
  const step = (max - min) / 10;
  for (let i = 0; i <= 10; i++) {
    const v = min + i * step;
    const bear = b(v);
    const p1 = polar(CX, CY, 108, bear);
    const p2 = polar(CX, CY, 122, bear);
    ticks.push(
      <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke="white" strokeWidth="2" />
    );
    const tp = polar(CX, CY, 92, bear);
    ticks.push(
      <text key={`lbl-${i}`} x={tp.x} y={tp.y}
        textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize="13" fontFamily="Arial,sans-serif">
        {Math.round(v)}
      </text>
    );
  }
  // Minor ticks
  for (let i = 0; i < 20; i++) {
    const v = min + (i + 0.5) * step / 2;
    if (v > max) continue;
    const bear = b(v);
    const p1 = polar(CX, CY, 114, bear);
    const p2 = polar(CX, CY, 122, bear);
    ticks.push(
      <line key={`m${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke="white" strokeWidth="1" />
    );
  }

  const redP = polar(CX, CY, 128, b(redLine));
  const redP2 = polar(CX, CY, 118, b(redLine));

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full" aria-label={`${label} ${Math.round(value)}${unit}`}>
      <defs>
        <radialGradient id={`eng-bezel-${label}`} cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor={darkMode ? "#2a2a2a" : "#909090"} />
          <stop offset="100%" stopColor={darkMode ? "#111" : "#555"} />
        </radialGradient>
      </defs>

      {/* Bezel */}
      <circle cx={CX} cy={CY} r={148} fill={`url(#eng-bezel-${label})`} />
      <circle cx={CX} cy={CY} r={148} fill="none" stroke={darkMode ? "#444" : "#aaa"} strokeWidth="3" />

      {/* Face */}
      <circle cx={CX} cy={CY} r={140} fill="#000" />

      {/* Arcs */}
      <path d={arcPath(CX, CY, 128, b(greenStart), b(greenEnd))}
        fill="none" stroke="#4CAF50" strokeWidth="7" />
      {yellowStart < yellowEnd && (
        <path d={arcPath(CX, CY, 128, b(yellowStart), b(yellowEnd))}
          fill="none" stroke="#FFC107" strokeWidth="7" />
      )}
      {/* Red line */}
      <line x1={redP2.x} y1={redP2.y} x2={redP.x} y2={redP.y}
        stroke="#F44336" strokeWidth="3" />

      {/* Ticks */}
      {ticks}

      {/* Label */}
      <text x={CX} y={CY + 52} textAnchor="middle" fill="white" fontSize="16"
        fontFamily="Arial,sans-serif" fontWeight="bold" letterSpacing="2">
        {label}
      </text>
      <text x={CX} y={CY + 67} textAnchor="middle" fill="white" fontSize="11"
        fontFamily="Arial,sans-serif" opacity={0.7}>{unit}</text>

      {/* Needle */}
      <g transform={`rotate(${needleBearing}, ${CX}, ${CY})`}>
        <line x1={CX} y1={CY} x2={CX} y2={CY + 20} stroke="white" strokeWidth="5"
          strokeLinecap="round" opacity={0.5} />
        <path d={`M ${CX - 1.5} ${CY + 16} L ${CX} ${CY - 88} L ${CX + 1.5} ${CY + 16} Z`}
          fill="white" />
      </g>

      <circle cx={CX} cy={CY} r={7} fill="#444" stroke="#999" strokeWidth="1.5" />

      {/* Readout */}
      <rect x={CX - 28} y={CY + 75} width="56" height="20" rx="3"
        fill="#111" stroke="#444" strokeWidth="1" />
      <text x={CX} y={CY + 89} textAnchor="middle" dominantBaseline="central"
        fill="#00FF88" fontSize="13" fontFamily="monospace">
        {Math.round(value)}{unit}
      </text>
    </svg>
  );
}
