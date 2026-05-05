"use client";
import React, { useState } from "react";
import { FlightData } from "@/types/flight";

interface Props {
  flightData: FlightData | null;
  darkMode: boolean;
  lastUpdate: Date | null;
  onOpenMetar?: () => void;
}

// Emergency squawk codes
const EMERGENCY_SQUAWKS: Record<string, { label: string; color: string; bg: string }> = {
  "7500": { label: "HIJACK",      color: "#fff", bg: "#b71c1c" },
  "7600": { label: "RADIO FAIL",  color: "#fff", bg: "#e65100" },
  "7700": { label: "EMERGENCY",   color: "#fff", bg: "#b71c1c" },
};

function formatCoord(deg: number | null, axis: "lat" | "lon"): string {
  if (deg == null) return "---";
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const mFull = (abs - d) * 60;
  const m = Math.floor(mFull);
  const s = ((mFull - m) * 60).toFixed(1);
  const dir = axis === "lat" ? (deg >= 0 ? "N" : "S") : (deg >= 0 ? "E" : "W");
  return `${d}° ${m}' ${s}" ${dir}`;
}

function formatCoordDecimal(deg: number | null, axis: "lat" | "lon"): string {
  if (deg == null) return "---";
  const dir = axis === "lat" ? (deg >= 0 ? "N" : "S") : (deg >= 0 ? "E" : "W");
  return `${Math.abs(deg).toFixed(5)}° ${dir}`;
}

export default function FlightInfoPanel({ flightData, darkMode, lastUpdate, onOpenMetar: _onOpenMetar }: Props) {
  const [coordMode, setCoordMode] = useState<"dec" | "dms">("dec");
  const s = flightData?.state;
  const m = flightData?.meta;

  const squawk = s?.squawk ?? null;
  const squawkAlert = squawk ? EMERGENCY_SQUAWKS[squawk] : null;

  const altFt  = s?.baro_altitude != null ? (s.baro_altitude * 3.281).toFixed(0) : "---";
  const spdKts = s?.velocity      != null ? (s.velocity * 1.944).toFixed(0)      : "---";
  const hdg    = s?.true_track    != null ? `${s.true_track.toFixed(0)}°`         : "---";
  const vsi    = s?.vertical_rate != null ? (s.vertical_rate * 196.85).toFixed(0) : "---";
  const vsiNum = s?.vertical_rate != null ? s.vertical_rate * 196.85 : 0;

  const lat = s?.latitude  ?? null;
  const lon = s?.longitude ?? null;
  const formatFn = coordMode === "dms" ? formatCoord : formatCoordDecimal;

  const panel = darkMode
    ? "bg-gray-900 border-gray-700 text-white"
    : "bg-gray-200 border-gray-400 text-gray-900";

  const card = darkMode
    ? "bg-gray-800 border-gray-600"
    : "bg-white border-gray-300";

  const label = darkMode ? "text-gray-400" : "text-gray-500";
  const value = darkMode ? "text-white" : "text-gray-900";

  return (
    <div className={`w-full border-b ${panel} px-4 py-2`}>
      {/* Row 1: Aircraft identity + squawk */}
      <div className="flex flex-wrap gap-2 items-start mb-2">

        {/* Callsign */}
        <div className={`flex-1 min-w-[90px] border rounded px-2 py-1 ${card}`}>
          <div className={`text-[10px] uppercase tracking-widest ${label}`}>Callsign</div>
          <div className={`text-sm font-bold font-mono ${value}`}>{s?.callsign || "---"}</div>
        </div>

        {/* Registration */}
        <div className={`flex-1 min-w-[90px] border rounded px-2 py-1 ${card}`}>
          <div className={`text-[10px] uppercase tracking-widest ${label}`}>Registration</div>
          <div className={`text-sm font-bold font-mono ${value}`}>{m?.registration || "---"}</div>
        </div>

        {/* Aircraft type */}
        <div className={`flex-1 min-w-[90px] border rounded px-2 py-1 ${card}`}>
          <div className={`text-[10px] uppercase tracking-widest ${label}`}>Type</div>
          <div className={`text-sm font-bold font-mono ${value}`}>
            {m?.typecode || m?.model || "---"}
          </div>
        </div>

        {/* Operator / Airline */}
        <div className={`flex-1 min-w-[110px] border rounded px-2 py-1 ${card}`}>
          <div className={`text-[10px] uppercase tracking-widest ${label}`}>Operator</div>
          <div className={`text-sm font-bold ${value} truncate`}>{m?.operator || m?.owner || "---"}</div>
        </div>

        {/* Country */}
        <div className={`flex-1 min-w-[90px] border rounded px-2 py-1 ${card}`}>
          <div className={`text-[10px] uppercase tracking-widest ${label}`}>Country</div>
          <div className={`text-sm font-bold ${value}`}>{s?.origin_country || "---"}</div>
        </div>

        {/* SQUAWK — prominent, with emergency alert */}
        <div
          className={`flex-1 min-w-[90px] border-2 rounded px-2 py-1 transition-all duration-300 ${
            squawkAlert
              ? "border-red-500 animate-pulse"
              : darkMode ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-white"
          }`}
          style={squawkAlert ? { background: squawkAlert.bg } : {}}
        >
          <div className={`text-[10px] uppercase tracking-widest ${squawkAlert ? "text-red-200" : label}`}>
            Squawk {squawkAlert ? "⚠ " + squawkAlert.label : ""}
          </div>
          <div
            className={`text-sm font-bold font-mono ${squawkAlert ? "text-white" : value}`}
          >
            {squawk || "----"}
          </div>
        </div>

        {/* Last updated */}
        <div className={`flex-1 min-w-[90px] border rounded px-2 py-1 ${card}`}>
          <div className={`text-[10px] uppercase tracking-widest ${label}`}>Updated</div>
          <div className={`text-xs font-mono ${value}`}>
            {lastUpdate ? lastUpdate.toLocaleTimeString() : "---"}
          </div>
        </div>
      </div>

      {/* Row 2: Flight data + coordinates */}
      <div className="flex flex-wrap gap-2 items-start">
        {/* Altitude */}
        <div className={`flex-1 min-w-[80px] border rounded px-2 py-1 ${card}`}>
          <div className={`text-[10px] uppercase tracking-widest ${label}`}>Altitude</div>
          <div className={`text-sm font-bold font-mono ${value}`}>{altFt} ft</div>
        </div>

        {/* Speed */}
        <div className={`flex-1 min-w-[80px] border rounded px-2 py-1 ${card}`}>
          <div className={`text-[10px] uppercase tracking-widest ${label}`}>Speed</div>
          <div className={`text-sm font-bold font-mono ${value}`}>{spdKts} kt</div>
        </div>

        {/* Heading */}
        <div className={`flex-1 min-w-[70px] border rounded px-2 py-1 ${card}`}>
          <div className={`text-[10px] uppercase tracking-widest ${label}`}>Heading</div>
          <div className={`text-sm font-bold font-mono ${value}`}>{hdg}</div>
        </div>

        {/* VSI */}
        <div className={`flex-1 min-w-[80px] border rounded px-2 py-1 ${card}`}>
          <div className={`text-[10px] uppercase tracking-widest ${label}`}>V/Speed</div>
          <div className={`text-sm font-bold font-mono ${
            vsiNum > 100 ? "text-green-400" : vsiNum < -100 ? "text-red-400" : value
          }`}>
            {vsiNum > 0 ? "+" : ""}{vsi} fpm
          </div>
        </div>

        {/* Coordinates — toggleable DMS / Decimal */}
        <div className={`flex-[3] min-w-[260px] border rounded px-2 py-1 ${card}`}>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] uppercase tracking-widest ${label}`}>Position</span>
            <button
              onClick={() => setCoordMode(m => m === "dec" ? "dms" : "dec")}
              className={`text-[9px] px-1.5 py-0.5 rounded border font-mono uppercase tracking-wider transition-colors ${
                darkMode
                  ? "border-gray-500 text-gray-300 hover:bg-gray-700"
                  : "border-gray-400 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {coordMode === "dec" ? "DMS" : "DEC"}
            </button>
          </div>
          <div className="flex gap-4">
            <div>
              <span className={`text-[9px] ${label}`}>LAT </span>
              <span className={`text-xs font-mono font-bold ${value}`}>{formatFn(lat, "lat")}</span>
            </div>
            <div>
              <span className={`text-[9px] ${label}`}>LON </span>
              <span className={`text-xs font-mono font-bold ${value}`}>{formatFn(lon, "lon")}</span>
            </div>
          </div>
        </div>

        {/* ICAO24 */}
        <div className={`flex-1 min-w-[80px] border rounded px-2 py-1 ${card}`}>
          <div className={`text-[10px] uppercase tracking-widest ${label}`}>ICAO24</div>
          <div className={`text-xs font-bold font-mono uppercase ${value}`}>
            {s?.icao24 || "---"}
          </div>
        </div>

        {/* On ground */}
        <div className={`flex-1 min-w-[80px] border rounded px-2 py-1 ${card}`}>
          <div className={`text-[10px] uppercase tracking-widest ${label}`}>Status</div>
          <div className={`text-xs font-bold ${s?.on_ground ? "text-yellow-400" : "text-green-400"}`}>
            {s?.on_ground ? "ON GROUND" : "AIRBORNE"}
          </div>
        </div>
      </div>
    </div>
  );
}
