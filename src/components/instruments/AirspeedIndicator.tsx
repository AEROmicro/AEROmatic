"use client";
import React from "react";
import { polar, arcPath, valueToBearing } from "./utils";

interface Props {
  airspeed: number; // knots
  darkMode: boolean;
}

const CX = 150, CY = 150;
const START = 220;   // bearing at 0 kts  (lower-left, ~8 o'clock)
const TOTAL = 280;   // total arc in degrees
const MAX_KT = 340;  // scale max

// Aviation speed limits (generic jetliner)
const VSO = 0;   // stall full flap
const VFE = 200; // max flap speed
const VS1 = 80;  // stall clean
const VNO = 280; // max structural cruise
const VNE = 320; // never exceed

function b(kts: number) { return valueToBearing(kts, 0, MAX_KT, START, TOTAL); }

export default function AirspeedIndicator({ airspeed, darkMode }: Props) {
  const needleBearing = b(airspeed);

  const ticks: React.ReactNode[] = [];
  for (let kts = 0; kts <= MAX_KT; kts += 10) {
    const bear = b(kts);
    const long = kts % 50 === 0;
    const rIn = long ? 108 : 113;
    const rOut = 124;
    const p1 = polar(CX, CY, rIn, bear);
    const p2 = polar(CX, CY, rOut, bear);
    ticks.push(
      <line key={kts} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke="white" strokeWidth={long ? 2 : 1} />
    );
    if (long) {
      const tp = polar(CX, CY, 95, bear);
      ticks.push(
        <text key={`t${kts}`} x={tp.x} y={tp.y}
          textAnchor="middle" dominantBaseline="central"
          fill="white" fontSize="14" fontFamily="Arial, sans-serif"
          fontWeight="bold">
          {kts === 0 ? "" : kts}
        </text>
      );
    }
  }

  const rotationStr = `rotate(${needleBearing}, ${CX}, ${CY})`;

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full" aria-label={`Airspeed ${Math.round(airspeed)} knots`}>
      <defs>
        <radialGradient id="asi-bezel" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor={darkMode ? "#2a2a2a" : "#909090"} />
          <stop offset="100%" stopColor={darkMode ? "#111" : "#555"} />
        </radialGradient>
        <filter id="asi-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Bezel */}
      <circle cx={CX} cy={CY} r={148} fill="url(#asi-bezel)" />
      <circle cx={CX} cy={CY} r={148} fill="none" stroke={darkMode ? "#444" : "#aaa"} strokeWidth="3" />

      {/* Face */}
      <circle cx={CX} cy={CY} r={140} fill="#000" />

      {/* Speed arcs (outermost ring) */}
      {/* White arc: VS0–VFE */}
      <path d={arcPath(CX, CY, 130, b(VSO), b(VFE))} fill="none" stroke="white" strokeWidth="8" />
      {/* Green arc: VS1–VNO */}
      <path d={arcPath(CX, CY, 130, b(VS1), b(VNO))} fill="none" stroke="#4CAF50" strokeWidth="8" />
      {/* Yellow arc: VNO–VNE */}
      <path d={arcPath(CX, CY, 130, b(VNO), b(VNE))} fill="none" stroke="#FFC107" strokeWidth="8" />
      {/* Red radial: VNE */}
      {(() => {
        const p1 = polar(CX, CY, 122, b(VNE));
        const p2 = polar(CX, CY, 138, b(VNE));
        return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#F44336" strokeWidth="3" />;
      })()}

      {/* Tick marks + numbers */}
      {ticks}

      {/* Label */}
      <text x={CX} y={CY + 50} textAnchor="middle" fill="white" fontSize="10"
        fontFamily="Arial, sans-serif" letterSpacing="2">KNOTS</text>
      <text x={CX} y={CY - 60} textAnchor="middle" fill="white" fontSize="11"
        fontFamily="Arial, sans-serif" letterSpacing="1">AIRSPEED</text>

      {/* Needle */}
      <g transform={rotationStr} filter={darkMode ? "url(#asi-glow)" : undefined}>
        {/* Counterweight */}
        <line x1={CX} y1={CY} x2={CX} y2={CY + 28} stroke="white" strokeWidth="5"
          strokeLinecap="round" opacity={0.6} />
        {/* Main needle */}
        <path d={`M ${CX - 1.5} ${CY + 20} L ${CX} ${CY - 95} L ${CX + 1.5} ${CY + 20} Z`}
          fill="white" />
      </g>

      {/* Centre cap */}
      <circle cx={CX} cy={CY} r={7} fill="#555" stroke="#999" strokeWidth="1.5" />

      {/* Digital readout */}
      <rect x={CX - 28} y={CY + 65} width="56" height="20" rx="3"
        fill="#111" stroke="#444" strokeWidth="1" />
      <text x={CX} y={CY + 79} textAnchor="middle" dominantBaseline="central"
        fill="#00FF88" fontSize="12" fontFamily="monospace">
        {String(Math.round(Math.max(0, airspeed))).padStart(3, "0")} KT
      </text>
    </svg>
  );
}
