"use client";
import React from "react";
import { polar, arcPath, valueToBearing } from "./utils";

interface Props {
  mach: number;      // 0.0 – 1.0+
  darkMode: boolean;
}

const CX = 150, CY = 150;
const START = 220;
const TOTAL = 260;

const b = (v: number) => valueToBearing(v, 0, 1.0, START, TOTAL);

export default function MachMeter({ mach, darkMode }: Props) {
  const clamped = Math.min(Math.max(mach, 0), 1.05);
  const needleBearing = b(clamped);

  const ticks: React.ReactNode[] = [];
  for (let i = 0; i <= 10; i++) {
    const v = i / 10;
    const bear = b(v);
    const p1 = polar(CX, CY, 107, bear);
    const p2 = polar(CX, CY, 125, bear);
    ticks.push(
      <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke="white" strokeWidth="2" />
    );
    const tp = polar(CX, CY, 92, bear);
    ticks.push(
      <text key={`lbl-${i}`} x={tp.x} y={tp.y}
        textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize="13" fontFamily="Arial,sans-serif">
        .{i}
      </text>
    );
  }
  // Minor ticks every 0.05
  for (let i = 0; i < 20; i++) {
    const v = i * 0.05;
    if (v % 0.1 === 0 || v > 1.0) continue;
    const bear = b(v);
    const p1 = polar(CX, CY, 116, bear);
    const p2 = polar(CX, CY, 125, bear);
    ticks.push(
      <line key={`m${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke="white" strokeWidth="1" />
    );
  }

  const needleColor = clamped >= 0.9 ? "#F44336" : clamped >= 0.8 ? "#FFC107" : "white";

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full" aria-label={`Mach ${mach.toFixed(3)}`}>
      <defs>
        <radialGradient id="mach-bezel" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor={darkMode ? "#2a2a2a" : "#909090"} />
          <stop offset="100%" stopColor={darkMode ? "#111" : "#555"} />
        </radialGradient>
      </defs>
      <circle cx={CX} cy={CY} r={148} fill="url(#mach-bezel)" />
      <circle cx={CX} cy={CY} r={148} fill="none" stroke={darkMode ? "#444" : "#aaa"} strokeWidth="3" />
      <circle cx={CX} cy={CY} r={140} fill="#000" />

      <path d={arcPath(CX, CY, 130, b(0), b(0.8))} fill="none" stroke="#4CAF50" strokeWidth="7" />
      <path d={arcPath(CX, CY, 130, b(0.8), b(0.9))} fill="none" stroke="#FFC107" strokeWidth="7" />
      <path d={arcPath(CX, CY, 130, b(0.9), b(1.0))} fill="none" stroke="#F44336" strokeWidth="7" />

      {ticks}

      <text x={CX} y={CY + 50} textAnchor="middle" fill="white" fontSize="14"
        fontFamily="Arial,sans-serif" fontWeight="bold" letterSpacing="2">MACH</text>

      <g transform={`rotate(${needleBearing}, ${CX}, ${CY})`}>
        <line x1={CX} y1={CY} x2={CX} y2={CY + 22} stroke={needleColor} strokeWidth="5"
          strokeLinecap="round" opacity={0.5} />
        <path d={`M ${CX - 1.5} ${CY + 18} L ${CX} ${CY - 90} L ${CX + 1.5} ${CY + 18} Z`}
          fill={needleColor} />
      </g>
      <circle cx={CX} cy={CY} r={7} fill="#444" stroke="#999" strokeWidth="1.5" />

      <rect x={CX - 34} y={CY + 68} width="68" height="20" rx="3"
        fill="#111" stroke="#444" strokeWidth="1" />
      <text x={CX} y={CY + 82} textAnchor="middle" dominantBaseline="central"
        fill={needleColor} fontSize="13" fontFamily="monospace" fontWeight="bold">
        M {mach.toFixed(3)}
      </text>
    </svg>
  );
}
