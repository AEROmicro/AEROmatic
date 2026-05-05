"use client";
import React from "react";
import { polar, arcPath, valueToBearing } from "./utils";

interface Props {
  fuelPct: number;   // 0–100%
  label?: string;    // "L" or "R" or "TOTAL"
  darkMode: boolean;
}

const CX = 150, CY = 150;
const START = 220;
const TOTAL = 240;

const b = (v: number) => valueToBearing(v, 0, 100, START, TOTAL);

export default function FuelGauge({ fuelPct, label = "FUEL", darkMode }: Props) {
  const clamped = Math.min(Math.max(fuelPct, 0), 100);
  const needleBearing = b(clamped);
  const color = clamped <= 10 ? "#F44336" : clamped <= 20 ? "#FFC107" : "#4CAF50";

  const ticks: React.ReactNode[] = [];
  for (let v = 0; v <= 100; v += 20) {
    const bear = b(v);
    const p1 = polar(CX, CY, 108, bear);
    const p2 = polar(CX, CY, 125, bear);
    ticks.push(
      <line key={v} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke="white" strokeWidth="2.5" />
    );
    const tp = polar(CX, CY, 92, bear);
    const labels: Record<number, string> = { 0: "E", 20: "¼", 40: "½", 60: "¾", 80: "", 100: "F" };
    ticks.push(
      <text key={`lbl-${v}`} x={tp.x} y={tp.y}
        textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize="14" fontFamily="Arial,sans-serif" fontWeight="bold">
        {labels[v]}
      </text>
    );
  }
  // Minor ticks every 10%
  for (let v = 0; v <= 100; v += 10) {
    if (v % 20 === 0) continue;
    const bear = b(v);
    const p1 = polar(CX, CY, 116, bear);
    const p2 = polar(CX, CY, 125, bear);
    ticks.push(
      <line key={`m${v}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke="white" strokeWidth="1" />
    );
  }

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full" aria-label={`${label} Fuel ${Math.round(clamped)}%`}>
      <defs>
        <radialGradient id={`fuel-bezel-${label}`} cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor={darkMode ? "#2a2a2a" : "#909090"} />
          <stop offset="100%" stopColor={darkMode ? "#111" : "#555"} />
        </radialGradient>
      </defs>
      <circle cx={CX} cy={CY} r={148} fill={`url(#fuel-bezel-${label})`} />
      <circle cx={CX} cy={CY} r={148} fill="none" stroke={darkMode ? "#444" : "#aaa"} strokeWidth="3" />
      <circle cx={CX} cy={CY} r={140} fill="#000" />

      {/* Low fuel arc */}
      <path d={arcPath(CX, CY, 130, b(0), b(20))} fill="none" stroke="#F44336" strokeWidth="7" />
      <path d={arcPath(CX, CY, 130, b(20), b(50))} fill="none" stroke="#FFC107" strokeWidth="7" />
      <path d={arcPath(CX, CY, 130, b(50), b(100))} fill="none" stroke="#4CAF50" strokeWidth="7" />

      {ticks}

      {/* Low fuel warning */}
      {clamped <= 20 && (
        <text x={CX} y={CY - 55} textAnchor="middle" fill="#F44336" fontSize="13"
          fontFamily="Arial,sans-serif" fontWeight="bold">
          LOW FUEL
        </text>
      )}

      <text x={CX} y={CY + 50} textAnchor="middle" fill="white" fontSize="14"
        fontFamily="Arial,sans-serif" fontWeight="bold" letterSpacing="2">
        {label}
      </text>

      <g transform={`rotate(${needleBearing}, ${CX}, ${CY})`}>
        <line x1={CX} y1={CY} x2={CX} y2={CY + 22} stroke={color} strokeWidth="5"
          strokeLinecap="round" opacity={0.5} />
        <path d={`M ${CX - 1.5} ${CY + 18} L ${CX} ${CY - 90} L ${CX + 1.5} ${CY + 18} Z`}
          fill={color} />
      </g>
      <circle cx={CX} cy={CY} r={7} fill="#444" stroke="#999" strokeWidth="1.5" />

      <rect x={CX - 26} y={CY + 68} width="52" height="20" rx="3"
        fill="#111" stroke="#444" strokeWidth="1" />
      <text x={CX} y={CY + 82} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize="12" fontFamily="monospace" fontWeight="bold">
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}
