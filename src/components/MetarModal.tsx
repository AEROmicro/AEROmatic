"use client";
import React, { useState, useEffect, useCallback } from "react";

interface MetarData {
  station: string;
  raw: string;
  time: string;
  temp_c: number | null;
  dewpoint_c: number | null;
  wind_dir: number | null;
  wind_speed_kt: number | null;
  wind_gust_kt: number | null;
  visibility_sm: number | null;
  altimeter_inhg: string | null;
  altimeter_hpa: number | null;
  wx_string: string | null;
  sky_cover: { cover: string; base: number }[];
  flight_category: string | null;
  ceiling_ft: number | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultAirport?: string;
  darkMode: boolean;
}

const FLIGHT_CAT_COLOR: Record<string, string> = {
  VFR:  "#4CAF50",
  MVFR: "#2196F3",
  IFR:  "#F44336",
  LIFR: "#9C27B0",
};

function windDir(deg: number | null): string {
  if (deg == null) return "---";
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

export default function MetarModal({ isOpen, onClose, defaultAirport = "", darkMode }: Props) {
  const [airport, setAirport] = useState(defaultAirport.toUpperCase());
  const [metar, setMetar] = useState<MetarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update airport input when prop changes (e.g. destination airport)
  useEffect(() => {
    if (defaultAirport) setAirport(defaultAirport.toUpperCase());
  }, [defaultAirport]);

  const fetchMetar = useCallback(async (icao: string) => {
    if (!icao) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/metar?ids=${encodeURIComponent(icao)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setMetar(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch METAR");
      setMetar(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch when opened with a default airport
  useEffect(() => {
    if (isOpen && defaultAirport) fetchMetar(defaultAirport.toUpperCase());
  }, [isOpen, defaultAirport, fetchMetar]);

  if (!isOpen) return null;

  const bg   = darkMode ? "bg-gray-900 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300";
  const row  = darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200";
  const lbl  = darkMode ? "text-gray-400" : "text-gray-500";
  const cat  = metar?.flight_category ? FLIGHT_CAT_COLOR[metar.flight_category] ?? "#aaa" : "#aaa";
  const inputCls = `flex-1 px-3 py-2 rounded border font-mono text-sm uppercase ${
    darkMode
      ? "bg-gray-700 border-gray-500 text-white placeholder-gray-500"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}>
      <div
        className={`relative w-full max-w-2xl rounded-xl border-2 shadow-2xl overflow-hidden ${bg}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3 border-b ${
          darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-100"
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">⛅</span>
            <span className="text-base font-bold tracking-wider">METAR / WEATHER REPORT</span>
            {metar?.flight_category && (
              <span className="px-2 py-0.5 rounded text-xs font-bold text-white"
                style={{ background: cat }}>
                {metar.flight_category}
              </span>
            )}
          </div>
          <button onClick={onClose}
            className="text-gray-400 hover:text-white text-xl font-bold leading-none px-2">×</button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 flex gap-3">
          <input
            className={inputCls}
            value={airport}
            onChange={e => setAirport(e.target.value.toUpperCase().slice(0, 4))}
            placeholder="ICAO airport code (e.g. EGLL)"
            maxLength={4}
            onKeyDown={e => e.key === "Enter" && fetchMetar(airport)}
          />
          <button
            onClick={() => fetchMetar(airport)}
            disabled={loading || airport.length < 3}
            className={`px-4 py-2 rounded font-bold text-sm tracking-wider transition-colors ${
              loading || airport.length < 3
                ? "bg-gray-500 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
          >
            {loading ? "..." : "FETCH"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mb-3 px-3 py-2 rounded bg-red-900 border border-red-600 text-red-300 text-sm">
            ⚠ {error}
          </div>
        )}

        {/* METAR data */}
        {metar && (
          <div className="px-5 pb-5 space-y-3">
            {/* Raw METAR */}
            <div className={`px-3 py-2 rounded border font-mono text-sm break-all ${row}`}>
              <span className={`text-xs uppercase tracking-wider ${lbl} block mb-1`}>Raw METAR</span>
              {metar.raw}
            </div>

            {/* Decoded grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* Station */}
              <div className={`rounded border px-3 py-2 ${row}`}>
                <div className={`text-[10px] uppercase tracking-widest ${lbl}`}>Station</div>
                <div className="text-sm font-bold font-mono">{metar.station}</div>
              </div>

              {/* Report time */}
              <div className={`rounded border px-3 py-2 ${row}`}>
                <div className={`text-[10px] uppercase tracking-widest ${lbl}`}>Time (UTC)</div>
                <div className="text-sm font-bold font-mono">
                  {metar.time ? new Date(metar.time).toUTCString().slice(17, 25) : "---"}
                </div>
              </div>

              {/* Wind */}
              <div className={`rounded border px-3 py-2 ${row}`}>
                <div className={`text-[10px] uppercase tracking-widest ${lbl}`}>Wind</div>
                <div className="text-sm font-bold font-mono">
                  {metar.wind_dir != null
                    ? `${String(metar.wind_dir).padStart(3, "0")}° ${windDir(metar.wind_dir)} ${metar.wind_speed_kt ?? 0}kt`
                    : "---"}
                  {metar.wind_gust_kt ? ` G${metar.wind_gust_kt}kt` : ""}
                </div>
              </div>

              {/* Visibility */}
              <div className={`rounded border px-3 py-2 ${row}`}>
                <div className={`text-[10px] uppercase tracking-widest ${lbl}`}>Visibility</div>
                <div className="text-sm font-bold font-mono">
                  {metar.visibility_sm != null
                    ? metar.visibility_sm >= 10 ? "10+ sm" : `${metar.visibility_sm} sm`
                    : "---"}
                </div>
              </div>

              {/* Temperature */}
              <div className={`rounded border px-3 py-2 ${row}`}>
                <div className={`text-[10px] uppercase tracking-widest ${lbl}`}>Temp / Dew</div>
                <div className="text-sm font-bold font-mono">
                  {metar.temp_c != null ? `${metar.temp_c}°C` : "---"}
                  {" / "}
                  {metar.dewpoint_c != null ? `${metar.dewpoint_c}°C` : "---"}
                </div>
              </div>

              {/* Altimeter */}
              <div className={`rounded border px-3 py-2 ${row}`}>
                <div className={`text-[10px] uppercase tracking-widest ${lbl}`}>Altimeter</div>
                <div className="text-sm font-bold font-mono">
                  {metar.altimeter_inhg ? `${metar.altimeter_inhg} inHg` : "---"}
                  {metar.altimeter_hpa ? ` / ${Math.round(metar.altimeter_hpa)} hPa` : ""}
                </div>
              </div>

              {/* Weather string */}
              {metar.wx_string && (
                <div className={`col-span-2 rounded border px-3 py-2 ${row}`}>
                  <div className={`text-[10px] uppercase tracking-widest ${lbl}`}>Weather</div>
                  <div className="text-sm font-bold">{metar.wx_string}</div>
                </div>
              )}

              {/* Ceiling */}
              <div className={`rounded border px-3 py-2 ${row}`}>
                <div className={`text-[10px] uppercase tracking-widest ${lbl}`}>Ceiling</div>
                <div className="text-sm font-bold font-mono">
                  {metar.ceiling_ft != null ? `${metar.ceiling_ft} ft` : "No ceiling"}
                </div>
              </div>

              {/* Sky cover */}
              {metar.sky_cover && metar.sky_cover.length > 0 && (
                <div className={`col-span-2 rounded border px-3 py-2 ${row}`}>
                  <div className={`text-[10px] uppercase tracking-widest ${lbl}`}>Sky Cover</div>
                  <div className="text-sm font-bold font-mono">
                    {metar.sky_cover
                      .map(c => `${c.cover} ${c.base ? c.base + "ft" : ""}`)
                      .join("  •  ")}
                  </div>
                </div>
              )}
            </div>

            {/* Flight category legend */}
            <div className={`rounded border px-3 py-1.5 ${row} flex flex-wrap gap-3 text-xs`}>
              {Object.entries(FLIGHT_CAT_COLOR).map(([k, v]) => (
                <span key={k} className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: v }} />
                  <span className={lbl}>{k}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
