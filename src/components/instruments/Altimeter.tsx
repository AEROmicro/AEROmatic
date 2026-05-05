"use client";
import React from "react";
import { polar } from "./utils";

interface Props {
  altitude: number;  // feet
  darkMode: boolean;
}

const CX = 150, CY = 150;

// Place numbers 1..0 around the dial (each at 36° intervals)
// 0 is at bearing 0 (top), 1 at 36°, 2 at 72°, etc.
function numBearing(n: number) {
  return n * 36; // n=0..9
}

export default function Altimeter({ altitude, darkMode }: Props) {
  const alt = Math.max(0, altitude);

  // Three needles:
  //  hundreds: 0° per 0 ft, 360° per 1,000 ft
  //  thousands: 0° per 0 ft, 360° per 10,000 ft
  //  tenThousands: 0° per 0 ft, 360° per 100,000 ft
  const hundredsAngle   = ((alt % 1000)   / 1000)  * 360;
  const thousandsAngle  = ((alt % 10000)  / 10000) * 360;
  const tenThousAngle   = (alt / 100000)  * 360;

  // Kollsman window (static 29.92 inHg / 1013 hPa)
  const kollsmanInHg = 29.92;

  const ticks: React.ReactNode[] = [];
  for (let n = 0; n < 10; n++) {
    const bear = numBearing(n);
    const p1 = polar(CX, CY, 112, bear);
    const p2 = polar(CX, CY, 125, bear);
    ticks.push(
      <line key={`t-${n}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke="white" strokeWidth="2" />
    );
    // 5-degree sub-marks
    const subBear = bear + 18;
    const s1 = polar(CX, CY, 117, subBear);
    const s2 = polar(CX, CY, 125, subBear);
    ticks.push(
      <line key={`s-${n}`} x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y}
        stroke="white" strokeWidth="1" />
    );
    const tp = polar(CX, CY, 98, bear);
    ticks.push(
      <text key={`n-${n}`} x={tp.x} y={tp.y}
        textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize="15" fontFamily="Arial,sans-serif" fontWeight="bold">
        {n}
      </text>
    );
  }

  // Diagonal stripe warning sector (near 0 – ground proximity)
  // Covers -20° to +20° from top (bearing 340° to 20°) — only visible below 1000ft
  const showGndWarn = alt < 1000;

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full" aria-label={`Altitude ${Math.round(alt)} feet`}>
      <defs>
        <radialGradient id="alt-bezel" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor={darkMode ? "#2a2a2a" : "#909090"} />
          <stop offset="100%" stopColor={darkMode ? "#111" : "#555"} />
        </radialGradient>
        <clipPath id="alt-clip"><circle cx={CX} cy={CY} r={140} /></clipPath>
        <pattern id="alt-stripe" patternUnits="userSpaceOnUse" width="10" height="10"
          patternTransform="rotate(45)">
          <rect width="5" height="10" fill="#F44336" opacity={0.7} />
          <rect x="5" width="5" height="10" fill="#000" opacity={0.5} />
        </pattern>
      </defs>

      {/* Bezel */}
      <circle cx={CX} cy={CY} r={148} fill="url(#alt-bezel)" />
      <circle cx={CX} cy={CY} r={148} fill="none" stroke={darkMode ? "#444" : "#aaa"} strokeWidth="3" />

      {/* Face */}
      <circle cx={CX} cy={CY} r={140} fill="#000" />

      {/* Ground proximity stripe (near zero) */}
      {showGndWarn && (
        <g clipPath="url(#alt-clip)">
          <path
            d={`M ${CX} ${CY} L ${polar(CX, CY, 140, 340).x} ${polar(CX, CY, 140, 340).y} A 140 140 0 0 1 ${polar(CX, CY, 140, 20).x} ${polar(CX, CY, 140, 20).y} Z`}
            fill="url(#alt-stripe)" />
        </g>
      )}

      {/* Tick marks + numbers */}
      {ticks}

      {/* Kollsman window */}
      <rect x={CX + 68} y={CY - 14} width="48" height="28" rx="3"
        fill="#111" stroke="#666" strokeWidth="1.5" />
      <text x={CX + 92} y={CY - 3} textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize="9" fontFamily="Arial,sans-serif" opacity={0.7}>inHg</text>
      <text x={CX + 92} y={CY + 9} textAnchor="middle" dominantBaseline="central"
        fill="#00FF88" fontSize="11" fontFamily="monospace" fontWeight="bold">
        {kollsmanInHg.toFixed(2)}
      </text>

      {/* Ten-thousands needle (short, thick) */}
      <g transform={`rotate(${tenThousAngle}, ${CX}, ${CY})`}>
        <rect x={CX - 2.5} y={CY - 65} width="5" height="70" rx="2"
          fill="#ccc" opacity={0.9} />
        <line x1={CX} y1={CY} x2={CX} y2={CY + 18} stroke="#ccc" strokeWidth="5"
          strokeLinecap="round" opacity={0.6} />
      </g>

      {/* Thousands needle (medium) */}
      <g transform={`rotate(${thousandsAngle}, ${CX}, ${CY})`}>
        <rect x={CX - 2} y={CY - 82} width="4" height="87" rx="2" fill="white" />
        <line x1={CX} y1={CY} x2={CX} y2={CY + 22} stroke="white" strokeWidth="4"
          strokeLinecap="round" opacity={0.5} />
      </g>

      {/* Hundreds needle (long, thin) */}
      <g transform={`rotate(${hundredsAngle}, ${CX}, ${CY})`}>
        <path d={`M ${CX - 1.5} ${CY + 28} L ${CX} ${CY - 100} L ${CX + 1.5} ${CY + 28} Z`}
          fill="white" />
        <line x1={CX} y1={CY} x2={CX} y2={CY + 28} stroke="white" strokeWidth="3"
          strokeLinecap="round" opacity={0.4} />
      </g>

      {/* Centre cap */}
      <circle cx={CX} cy={CY} r={8} fill="#444" stroke="#999" strokeWidth="1.5" />

      {/* Label */}
      <text x={CX} y={CY + 52} textAnchor="middle" fill="white" fontSize="10"
        fontFamily="Arial,sans-serif" letterSpacing="1">ALTITUDE</text>
      <text x={CX} y={CY + 63} textAnchor="middle" fill="white" fontSize="9"
        fontFamily="Arial,sans-serif" opacity={0.7} letterSpacing="1">FEET</text>

      {/* Digital readout */}
      <rect x={CX - 35} y={CY + 70} width="70" height="20" rx="3"
        fill="#111" stroke="#444" strokeWidth="1" />
      <text x={CX} y={CY + 84} textAnchor="middle" dominantBaseline="central"
        fill="#00FF88" fontSize="13" fontFamily="monospace">
        {String(Math.round(alt)).padStart(6, "0")} ft
      </text>
    </svg>
  );
}
