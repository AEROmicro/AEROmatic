"use client";
import React from "react";
import { polar } from "./utils";

interface Props {
  heading: number; // degrees 0-359
  darkMode: boolean;
}

const CX = 150, CY = 150;

const CARDINALS: { label: string; bearing: number }[] = [
  { label: "N",  bearing: 0   },
  { label: "E",  bearing: 90  },
  { label: "S",  bearing: 180 },
  { label: "W",  bearing: 270 },
];

export default function HeadingIndicator({ heading, darkMode }: Props) {
  // The compass card rotates so that the current heading is at the top
  const cardRotation = -heading;

  const ticks: React.ReactNode[] = [];
  for (let deg = 0; deg < 360; deg += 5) {
    const major = deg % 30 === 0;
    const medium = deg % 10 === 0 && !major;
    const rIn  = major ? 105 : medium ? 112 : 116;
    const rOut = 124;
    const p1 = polar(CX, CY, rIn, deg);
    const p2 = polar(CX, CY, rOut, deg);
    ticks.push(
      <line key={deg} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke="white" strokeWidth={major ? 2 : medium ? 1.5 : 1} opacity={0.9} />
    );
    // Number labels every 30°: show as "3", "6" … "36"
    if (major) {
      const isCardinal = CARDINALS.some(c => c.bearing === deg);
      if (!isCardinal) {
        const numLabel = deg === 0 ? "36" : String(deg / 10).padStart(2, "0");
        const tp = polar(CX, CY, 91, deg);
        ticks.push(
          <text key={`n-${deg}`} x={tp.x} y={tp.y}
            textAnchor="middle" dominantBaseline="central"
            fill="white" fontSize="13" fontFamily="Arial,sans-serif" fontWeight="bold">
            {numLabel}
          </text>
        );
      }
    }
  }

  // Cardinal labels
  const cardinalLabels = CARDINALS.map(({ label, bearing }) => {
    const tp = polar(CX, CY, 91, bearing);
    return (
      <text key={label} x={tp.x} y={tp.y}
        textAnchor="middle" dominantBaseline="central"
        fill={label === "N" ? "#F44336" : "white"}
        fontSize="15" fontFamily="Arial,sans-serif" fontWeight="bold">
        {label}
      </text>
    );
  });

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full" aria-label={`Heading ${Math.round(heading)}°`}>
      <defs>
        <radialGradient id="hsi-bezel" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor={darkMode ? "#2a2a2a" : "#909090"} />
          <stop offset="100%" stopColor={darkMode ? "#111" : "#555"} />
        </radialGradient>
        <clipPath id="hsi-clip"><circle cx={CX} cy={CY} r={130} /></clipPath>
      </defs>

      {/* Bezel */}
      <circle cx={CX} cy={CY} r={148} fill="url(#hsi-bezel)" />
      <circle cx={CX} cy={CY} r={148} fill="none" stroke={darkMode ? "#444" : "#aaa"} strokeWidth="3" />

      {/* Face */}
      <circle cx={CX} cy={CY} r={140} fill="#000" />

      {/* Compass card (rotates) */}
      <g transform={`rotate(${cardRotation}, ${CX}, ${CY})`} clipPath="url(#hsi-clip)">
        {/* Course ring background */}
        <circle cx={CX} cy={CY} r={130} fill="#0a0a0a" />
        {ticks}
        {cardinalLabels}
      </g>

      {/* Fixed lubber line / reference mark at top */}
      <polygon points={`${CX},${CY - 127} ${CX - 8},${CY - 113} ${CX + 8},${CY - 113}`}
        fill="#FFC107" />
      {/* Fixed aircraft reference */}
      {/* Left wing */}
      <rect x={CX - 40} y={CY - 3} width="32" height="5" fill="white" rx="2" opacity={0.85} />
      {/* Right wing */}
      <rect x={CX + 8} y={CY - 3} width="32" height="5" fill="white" rx="2" opacity={0.85} />
      {/* Nose */}
      <circle cx={CX} cy={CY} r={4} fill="white" opacity={0.85} />
      {/* Tail */}
      <rect x={CX - 3} y={CY + 5} width="6" height="16" fill="white" rx="1" opacity={0.85} />

      {/* Fixed outer ring */}
      <circle cx={CX} cy={CY} r={130} fill="none" stroke={darkMode ? "#555" : "#888"} strokeWidth="1.5" />

      {/* Heading digital readout */}
      <rect x={CX - 28} y={CY + 70} width="56" height="22" rx="3"
        fill="#111" stroke="#444" strokeWidth="1" />
      <text x={CX} y={CY + 85} textAnchor="middle" dominantBaseline="central"
        fill="#00FF88" fontSize="13" fontFamily="monospace" fontWeight="bold">
        {String(Math.round(heading) % 360).padStart(3, "0")}°
      </text>

      {/* Label */}
      <text x={CX} y={CY + 112} textAnchor="middle" fill="white" fontSize="10"
        fontFamily="Arial,sans-serif" letterSpacing="2" opacity={0.7}>HDG</text>
    </svg>
  );
}
