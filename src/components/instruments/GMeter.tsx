"use client";
import React from "react";
import { polar, arcPath, valueToBearing } from "./utils";

interface Props {
  gForce: number;    // G load, typically 0 to +4
  darkMode: boolean;
}

const CX = 150, CY = 150;
const MIN_G = -2;
const MAX_G = 5;
const START = 220;
const TOTAL = 260;

const b = (v: number) => valueToBearing(v, MIN_G, MAX_G, START, TOTAL);

export default function GMeter({ gForce, darkMode }: Props) {
  const clamped = Math.min(Math.max(gForce, MIN_G), MAX_G);
  const needleBearing = b(clamped);

  const ticks: React.ReactNode[] = [];
  for (let g = MIN_G; g <= MAX_G; g++) {
    const bear = b(g);
    const p1 = polar(CX, CY, 106, bear);
    const p2 = polar(CX, CY, 124, bear);
    ticks.push(
      <line key={g} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke="white" strokeWidth="2.5" />
    );
    const tp = polar(CX, CY, 91, bear);
    ticks.push(
      <text key={`lbl-${g}`} x={tp.x} y={tp.y}
        textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize="14" fontFamily="Arial,sans-serif" fontWeight="bold">
        {g}
      </text>
    );
  }
  // Half-G minor ticks
  for (let g = MIN_G; g < MAX_G; g++) {
    const v = g + 0.5;
    const bear = b(v);
    const p1 = polar(CX, CY, 113, bear);
    const p2 = polar(CX, CY, 124, bear);
    ticks.push(
      <line key={`m${g}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke="white" strokeWidth="1" />
    );
  }

  const needleColor = clamped > 3.5 || clamped < 0 ? "#F44336" :
    clamped > 2.5 ? "#FFC107" : "white";

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full" aria-label={`G-Force ${gForce.toFixed(1)}G`}>
      <defs>
        <radialGradient id="g-bezel" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor={darkMode ? "#2a2a2a" : "#909090"} />
          <stop offset="100%" stopColor={darkMode ? "#111" : "#555"} />
        </radialGradient>
      </defs>
      <circle cx={CX} cy={CY} r={148} fill="url(#g-bezel)" />
      <circle cx={CX} cy={CY} r={148} fill="none" stroke={darkMode ? "#444" : "#aaa"} strokeWidth="3" />
      <circle cx={CX} cy={CY} r={140} fill="#000" />

      {/* Green arc: normal G load (0–2.5G) */}
      <path d={arcPath(CX, CY, 130, b(0), b(2.5))} fill="none" stroke="#4CAF50" strokeWidth="7" />
      {/* Yellow: moderate (2.5–3.5G) */}
      <path d={arcPath(CX, CY, 130, b(2.5), b(3.5))} fill="none" stroke="#FFC107" strokeWidth="7" />
      {/* Red: high G (>3.5G or negative) */}
      <path d={arcPath(CX, CY, 130, b(3.5), b(MAX_G))} fill="none" stroke="#F44336" strokeWidth="7" />
      <path d={arcPath(CX, CY, 130, b(MIN_G), b(0))} fill="none" stroke="#F44336" strokeWidth="7" />

      {ticks}

      <text x={CX} y={CY + 52} textAnchor="middle" fill="white" fontSize="14"
        fontFamily="Arial,sans-serif" fontWeight="bold" letterSpacing="1">G LOAD</text>

      <g transform={`rotate(${needleBearing}, ${CX}, ${CY})`}>
        <line x1={CX} y1={CY} x2={CX} y2={CY + 22} stroke={needleColor} strokeWidth="5"
          strokeLinecap="round" opacity={0.5} />
        <path d={`M ${CX - 1.5} ${CY + 18} L ${CX} ${CY - 90} L ${CX + 1.5} ${CY + 18} Z`}
          fill={needleColor} />
      </g>
      <circle cx={CX} cy={CY} r={7} fill="#444" stroke="#999" strokeWidth="1.5" />

      <rect x={CX - 26} y={CY + 70} width="52" height="20" rx="3"
        fill="#111" stroke="#444" strokeWidth="1" />
      <text x={CX} y={CY + 84} textAnchor="middle" dominantBaseline="central"
        fill={needleColor} fontSize="13" fontFamily="monospace" fontWeight="bold">
        {gForce.toFixed(2)}G
      </text>
    </svg>
  );
}
