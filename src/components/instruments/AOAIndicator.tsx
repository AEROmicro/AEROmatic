"use client";
import React from "react";
import { polar, arcPath, valueToBearing } from "./utils";

interface Props {
  aoa: number;     // degrees angle of attack
  darkMode: boolean;
}

const CX = 150, CY = 150;
const MIN_AOA = -5;
const MAX_AOA = 25;
const START = 220;
const TOTAL = 240;

const b = (v: number) => valueToBearing(v, MIN_AOA, MAX_AOA, START, TOTAL);

export default function AOAIndicator({ aoa, darkMode }: Props) {
  const needleBearing = b(aoa);

  const ticks: React.ReactNode[] = [];
  for (let v = MIN_AOA; v <= MAX_AOA; v += 5) {
    const bear = b(v);
    const p1 = polar(CX, CY, 108, bear);
    const p2 = polar(CX, CY, 124, bear);
    ticks.push(
      <line key={v} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke="white" strokeWidth={v % 10 === 0 ? 2 : 1} />
    );
    if (v % 5 === 0) {
      const tp = polar(CX, CY, 93, bear);
      ticks.push(
        <text key={`lbl-${v}`} x={tp.x} y={tp.y}
          textAnchor="middle" dominantBaseline="central"
          fill="white" fontSize="13" fontFamily="Arial,sans-serif">
          {v}
        </text>
      );
    }
  }

  const needleColor = aoa < 12 ? "white" : aoa < 18 ? "#FFC107" : "#F44336";

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full" aria-label={`AOA ${aoa.toFixed(1)}°`}>
      <defs>
        <radialGradient id="aoa-bezel" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor={darkMode ? "#2a2a2a" : "#909090"} />
          <stop offset="100%" stopColor={darkMode ? "#111" : "#555"} />
        </radialGradient>
      </defs>
      <circle cx={CX} cy={CY} r={148} fill="url(#aoa-bezel)" />
      <circle cx={CX} cy={CY} r={148} fill="none" stroke={darkMode ? "#444" : "#aaa"} strokeWidth="3" />
      <circle cx={CX} cy={CY} r={140} fill="#000" />

      {/* Green arc: normal flight */}
      <path d={arcPath(CX, CY, 130, b(MIN_AOA), b(12))} fill="none" stroke="#4CAF50" strokeWidth="7" />
      {/* Yellow: approach stall */}
      <path d={arcPath(CX, CY, 130, b(12), b(18))} fill="none" stroke="#FFC107" strokeWidth="7" />
      {/* Red: stall */}
      <path d={arcPath(CX, CY, 130, b(18), b(MAX_AOA))} fill="none" stroke="#F44336" strokeWidth="7" />

      {ticks}

      <text x={CX} y={CY + 52} textAnchor="middle" fill="white" fontSize="12"
        fontFamily="Arial,sans-serif" letterSpacing="2">AOA</text>
      <text x={CX} y={CY + 64} textAnchor="middle" fill="white" fontSize="9"
        fontFamily="Arial,sans-serif" opacity={0.6}>DEGREES</text>

      {/* Stall warning text */}
      {aoa >= 18 && (
        <text x={CX} y={CY - 60} textAnchor="middle" fill="#F44336" fontSize="14"
          fontFamily="Arial,sans-serif" fontWeight="bold">STALL</text>
      )}

      <g transform={`rotate(${needleBearing}, ${CX}, ${CY})`}>
        <line x1={CX} y1={CY} x2={CX} y2={CY + 20} stroke={needleColor} strokeWidth="5"
          strokeLinecap="round" opacity={0.5} />
        <path d={`M ${CX - 1.5} ${CY + 16} L ${CX} ${CY - 90} L ${CX + 1.5} ${CY + 16} Z`}
          fill={needleColor} />
      </g>
      <circle cx={CX} cy={CY} r={7} fill="#444" stroke="#999" strokeWidth="1.5" />

      <rect x={CX - 26} y={CY + 72} width="52" height="20" rx="3"
        fill="#111" stroke="#444" strokeWidth="1" />
      <text x={CX} y={CY + 86} textAnchor="middle" dominantBaseline="central"
        fill={needleColor} fontSize="12" fontFamily="monospace">
        {aoa.toFixed(1)}°
      </text>
    </svg>
  );
}
