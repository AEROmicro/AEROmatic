"use client";
import React from "react";
import { polar, arcPath, valueToBearing } from "./utils";

interface Props {
  oat: number;      // outside air temperature °C
  darkMode: boolean;
}

const CX = 150, CY = 150;
const MIN_T = -70;
const MAX_T = 50;
const START = 220;
const TOTAL = 240;

const b = (v: number) => valueToBearing(v, MIN_T, MAX_T, START, TOTAL);

export default function OATGauge({ oat, darkMode }: Props) {
  const needleBearing = b(Math.min(Math.max(oat, MIN_T), MAX_T));
  const color = oat <= -40 ? "#64B5F6" : oat <= 0 ? "#81D4FA" : oat <= 20 ? "white" : "#FF7043";

  const ticks: React.ReactNode[] = [];
  for (let t = MIN_T; t <= MAX_T; t += 10) {
    const bear = b(t);
    const p1 = polar(CX, CY, 107, bear);
    const p2 = polar(CX, CY, 125, bear);
    ticks.push(
      <line key={t} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke="white" strokeWidth={t % 20 === 0 ? 2.5 : 1.5} />
    );
    if (t % 20 === 0 || t === -10 || t === 10) {
      const tp = polar(CX, CY, 91, bear);
      ticks.push(
        <text key={`lbl-${t}`} x={tp.x} y={tp.y}
          textAnchor="middle" dominantBaseline="central"
          fill="white" fontSize="12" fontFamily="Arial,sans-serif">
          {t}
        </text>
      );
    }
  }
  // Zero line
  const zeroP1 = polar(CX, CY, 100, b(0));
  const zeroP2 = polar(CX, CY, 130, b(0));
  ticks.push(
    <line key="zero" x1={zeroP1.x} y1={zeroP1.y} x2={zeroP2.x} y2={zeroP2.y}
      stroke="#64B5F6" strokeWidth="2" opacity={0.7} />
  );

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full" aria-label={`OAT ${oat.toFixed(0)}°C`}>
      <defs>
        <radialGradient id="oat-bezel" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor={darkMode ? "#2a2a2a" : "#909090"} />
          <stop offset="100%" stopColor={darkMode ? "#111" : "#555"} />
        </radialGradient>
      </defs>
      <circle cx={CX} cy={CY} r={148} fill="url(#oat-bezel)" />
      <circle cx={CX} cy={CY} r={148} fill="none" stroke={darkMode ? "#444" : "#aaa"} strokeWidth="3" />
      <circle cx={CX} cy={CY} r={140} fill="#000" />

      {/* Cold arc */}
      <path d={arcPath(CX, CY, 130, b(MIN_T), b(0))} fill="none" stroke="#64B5F6" strokeWidth="7" />
      {/* Warm arc */}
      <path d={arcPath(CX, CY, 130, b(0), b(MAX_T))} fill="none" stroke="#FF7043" strokeWidth="7" />

      {ticks}

      <text x={CX} y={CY + 52} textAnchor="middle" fill="white" fontSize="11"
        fontFamily="Arial,sans-serif" letterSpacing="2">OAT</text>
      <text x={CX} y={CY + 64} textAnchor="middle" fill="white" fontSize="9"
        fontFamily="Arial,sans-serif" opacity={0.6}>°CELSIUS</text>

      <g transform={`rotate(${needleBearing}, ${CX}, ${CY})`}>
        <line x1={CX} y1={CY} x2={CX} y2={CY + 22} stroke={color} strokeWidth="5"
          strokeLinecap="round" opacity={0.5} />
        <path d={`M ${CX - 1.5} ${CY + 18} L ${CX} ${CY - 90} L ${CX + 1.5} ${CY + 18} Z`}
          fill={color} />
      </g>
      <circle cx={CX} cy={CY} r={7} fill="#444" stroke="#999" strokeWidth="1.5" />

      <rect x={CX - 30} y={CY + 70} width="60" height="20" rx="3"
        fill="#111" stroke="#444" strokeWidth="1" />
      <text x={CX} y={CY + 84} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize="12" fontFamily="monospace" fontWeight="bold">
        {oat.toFixed(0)}°C
      </text>
    </svg>
  );
}
