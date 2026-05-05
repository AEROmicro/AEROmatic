"use client";
import React from "react";
import { polar } from "./utils";

interface Props {
  vsi: number;     // ft/min  –  negative = descending
  darkMode: boolean;
}

const CX = 150, CY = 150;
const MAX_FPM = 2000;

/** Maps ft/min to bearing angle on the dial.
 *  0 fpm   → bearing 270° (9 o'clock / left)
 * +2000    → bearing  90° (3 o'clock / right) via top
 * -2000    → bearing  90° (3 o'clock / right) via bottom
 */
function vsiBearing(fpm: number): number {
  const clamped = Math.min(Math.max(fpm, -MAX_FPM), MAX_FPM);
  if (clamped >= 0) {
    return 270 + (clamped / MAX_FPM) * 180;  // 270→450(=90) via top
  }
  return 270 - (Math.abs(clamped) / MAX_FPM) * 180; // 270→90 via bottom
}

export default function VerticalSpeedIndicator({ vsi, darkMode }: Props) {
  const needleBearing = vsiBearing(vsi);

  const rates = [500, 1000, 1500, 2000];
  const ticks: React.ReactNode[] = [];

  rates.forEach(r => {
    for (const sign of [1, -1]) {
      const fpm = r * sign;
      const bear = vsiBearing(fpm);
      const p1 = polar(CX, CY, 110, bear);
      const p2 = polar(CX, CY, 126, bear);
      ticks.push(
        <line key={`${sign}-${r}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
          stroke="white" strokeWidth={r % 1000 === 0 ? 2 : 1.2} />
      );
      if (r % 1000 === 0) {
        const tp = polar(CX, CY, 95, bear);
        ticks.push(
          <text key={`lbl-${sign}-${r}`} x={tp.x} y={tp.y}
            textAnchor="middle" dominantBaseline="central"
            fill="white" fontSize="14" fontFamily="Arial,sans-serif" fontWeight="bold">
            {r / 1000}
          </text>
        );
      }
    }
  });

  // Zero tick at 270°
  const zeroP1 = polar(CX, CY, 110, 270);
  const zeroP2 = polar(CX, CY, 126, 270);
  ticks.push(
    <line key="zero" x1={zeroP1.x} y1={zeroP1.y} x2={zeroP2.x} y2={zeroP2.y}
      stroke="white" strokeWidth="2.5" />
  );
  const zeroTp = polar(CX, CY, 95, 270);
  ticks.push(
    <text key="zero-lbl" x={zeroTp.x} y={zeroTp.y}
      textAnchor="middle" dominantBaseline="central"
      fill="white" fontSize="14" fontFamily="Arial,sans-serif" fontWeight="bold">
      0
    </text>
  );

  // UP / DOWN labels
  const upPos   = polar(CX, CY, 72, 0);    // top (12 o'clock)
  const downPos = polar(CX, CY, 72, 180);  // bottom (6 o'clock)

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full" aria-label={`VSI ${Math.round(vsi)} ft/min`}>
      <defs>
        <radialGradient id="vsi-bezel" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor={darkMode ? "#2a2a2a" : "#909090"} />
          <stop offset="100%" stopColor={darkMode ? "#111" : "#555"} />
        </radialGradient>
      </defs>

      {/* Bezel */}
      <circle cx={CX} cy={CY} r={148} fill="url(#vsi-bezel)" />
      <circle cx={CX} cy={CY} r={148} fill="none" stroke={darkMode ? "#444" : "#aaa"} strokeWidth="3" />

      {/* Face */}
      <circle cx={CX} cy={CY} r={140} fill="#000" />

      {/* Green arc: 0 fpm centre zone */}
      {/* Positive arc (270→360 range = ±500 fpm) */}
      <path d={`M ${polar(CX, CY, 118, 247.5).x} ${polar(CX, CY, 118, 247.5).y}
                 A 118 118 0 0 1 ${polar(CX, CY, 118, 292.5).x} ${polar(CX, CY, 118, 292.5).y}`}
        fill="none" stroke="#4CAF50" strokeWidth="5" opacity={0.5} />
      <path d={`M ${polar(CX, CY, 118, 292.5).x} ${polar(CX, CY, 118, 292.5).y}
                 A 118 118 0 0 0 ${polar(CX, CY, 118, 247.5).x} ${polar(CX, CY, 118, 247.5).y}`}
        fill="none" stroke="#4CAF50" strokeWidth="5" opacity={0.5} />

      {/* Tick marks */}
      {ticks}

      {/* UP / DOWN arrows */}
      <text x={upPos.x} y={upPos.y} textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize="12" fontFamily="Arial,sans-serif" opacity={0.6}>▲</text>
      <text x={downPos.x} y={downPos.y} textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize="12" fontFamily="Arial,sans-serif" opacity={0.6}>▼</text>

      {/* Labels */}
      <text x={CX + 45} y={CY - 45} textAnchor="middle" fill="white" fontSize="8"
        fontFamily="Arial,sans-serif" opacity={0.6}>×100</text>
      <text x={CX} y={CY + 50} textAnchor="middle" fill="white" fontSize="9"
        fontFamily="Arial,sans-serif" letterSpacing="1" opacity={0.8}>FT/MIN</text>
      <text x={CX} y={CY + 62} textAnchor="middle" fill="white" fontSize="8"
        fontFamily="Arial,sans-serif" opacity={0.6}>VERTICAL SPEED</text>

      {/* Needle */}
      <g transform={`rotate(${needleBearing}, ${CX}, ${CY})`}>
        {/* Counterweight */}
        <line x1={CX} y1={CY} x2={CX} y2={CY + 22} stroke="white" strokeWidth="5"
          strokeLinecap="round" opacity={0.5} />
        {/* Main needle */}
        <path d={`M ${CX - 1.5} ${CY + 18} L ${CX} ${CY - 88} L ${CX + 1.5} ${CY + 18} Z`}
          fill="white" />
      </g>

      {/* Centre cap */}
      <circle cx={CX} cy={CY} r={7} fill="#555" stroke="#999" strokeWidth="1.5" />

      {/* Digital rate */}
      <rect x={CX - 32} y={CY + 68} width="64" height="20" rx="3"
        fill="#111" stroke="#444" strokeWidth="1" />
      <text x={CX} y={CY + 82} textAnchor="middle" dominantBaseline="central"
        fill={vsi > 0 ? "#00FF88" : vsi < 0 ? "#F44336" : "#aaa"}
        fontSize="12" fontFamily="monospace">
        {vsi > 0 ? "+" : ""}{Math.round(vsi)} fpm
      </text>
    </svg>
  );
}
