"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import FlightInfoPanel  from "@/components/FlightInfoPanel";
import InstrumentPanel  from "@/components/InstrumentPanel";
import MetarModal       from "@/components/MetarModal";
import { FlightData, InstrumentValues } from "@/types/flight";

// Speed of sound (simplified ISA)
function machFromKtsAlt(kts: number, altFt: number): number {
  const sos = 661.5 * Math.sqrt(Math.max(0.1, 1 - altFt * 6.875e-6));
  return kts / sos;
}

// ISA OAT from altitude
function oatFromAlt(altFt: number): number {
  return 15 - (altFt / 1000) * 2;
}

// Derive all instrument values from raw OpenSky state
function deriveInstruments(data: FlightData | null): InstrumentValues {
  const defaults: InstrumentValues = {
    airspeed_kts: 0, altitude_ft: 0, vsi_fpm: 0,
    heading_deg: 0, pitch_deg: 0, bank_deg: 0, slip: 0,
    n1_pct: 0, n2_pct: 0, egt_c: 200, fuel_lbs: 75,
    flap_pos: 0, oat_c: 15, mach: 0, aoa_deg: 0, g_force: 1.0,
  };

  const s = data?.state;
  if (!s) return defaults;

  const kts    = s.velocity      != null ? s.velocity      * 1.944  : 0;
  const altFt  = s.baro_altitude != null ? s.baro_altitude * 3.281  : 0;
  const vsiFpm = s.vertical_rate != null ? s.vertical_rate * 196.85 : 0;
  const hdg    = s.true_track ?? 0;

  // Pitch: arctan(VSI_fps / airspeed_fps)
  const pitchRad = kts > 10
    ? Math.atan2(vsiFpm / 60, kts * 1.688)
    : 0;
  const pitchDeg = pitchRad * (180 / Math.PI);

  const oat  = oatFromAlt(altFt);
  const mach = machFromKtsAlt(kts, altFt);

  // AOA estimate
  const aoaDeg = Math.max(-3, Math.min(20,
    pitchDeg + 2 + (kts > 0 && kts < 200 ? (200 - kts) / 40 : 0)
  ));

  // Engine simulation based on flight phase
  let n1 = 0, egt = 200;
  if (!s.on_ground && kts > 10) {
    if (vsiFpm > 200) {
      n1  = Math.min(100, 85 + Math.min(10, vsiFpm / 200));
      egt = Math.min(900, 680 + vsiFpm / 10);
    } else if (vsiFpm < -200) {
      n1  = Math.max(30, 40 + Math.max(0, 200 + vsiFpm) / 20);
      egt = 400;
    } else {
      n1  = Math.min(100, Math.max(30, 78 + (kts - 250) / 50));
      egt = 560;
    }
  } else if (s.on_ground && kts < 5) {
    n1 = 22; egt = 280;
  }

  // Flap estimate
  let flap = 0;
  if (!s.on_ground && altFt < 5000 && kts < 200) flap = 15;
  if (!s.on_ground && altFt < 2000 && kts < 160) flap = 30;

  return {
    airspeed_kts: Math.max(0, kts),
    altitude_ft:  Math.max(0, altFt),
    vsi_fpm:      vsiFpm,
    heading_deg:  ((hdg % 360) + 360) % 360,
    pitch_deg:    pitchDeg,
    bank_deg:     0,
    slip:         0,
    n1_pct:       n1,
    n2_pct:       n1 * 0.98,
    egt_c:        egt,
    fuel_lbs:     75,
    flap_pos:     flap,
    oat_c:        oat,
    mach,
    aoa_deg:      aoaDeg,
    g_force:      1.0,
  };
}

const EMERGENCY_SQUAWKS = new Set(["7500", "7600", "7700"]);

export default function HomePage() {
  const [darkMode,      setDarkMode]      = useState(true);
  const [query,         setQuery]         = useState("");
  const [flightData,    setFlightData]    = useState<FlightData | null>(null);
  const [instruments,   setInstruments]   = useState<InstrumentValues>(deriveInstruments(null));
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [lastUpdate,    setLastUpdate]    = useState<Date | null>(null);
  const [showMetar,     setShowMetar]     = useState(false);
  const [metarAirport,  setMetarAirport]  = useState("");
  const pollingRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIcao = useRef<string | null>(null);

  // Fetch aircraft by ICAO24
  const fetchAircraft = useCallback(async (icao24: string) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/aircraft/${encodeURIComponent(icao24)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Not found");
      setFlightData(data as FlightData);
      setInstruments(deriveInstruments(data as FlightData));
      setLastUpdate(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fetch failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Search by registration or callsign
  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Not found");
      const icao = data.icao24 as string;
      currentIcao.current = icao;
      await fetchAircraft(icao);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Search failed");
      setLoading(false);
    }
  }, [query, fetchAircraft]);

  // Pick a random aircraft
  const handleRandom = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/random");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      const icao = data.icao24 as string;
      currentIcao.current = icao;
      setQuery(icao.toUpperCase());
      await fetchAircraft(icao);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
      setLoading(false);
    }
  }, [fetchAircraft]);

  // Auto-poll every 10 seconds
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      if (currentIcao.current) fetchAircraft(currentIcao.current);
    }, 10_000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [fetchAircraft]);

  const squawk      = flightData?.state?.squawk ?? null;
  const isEmergency = squawk != null && EMERGENCY_SQUAWKS.has(squawk);

  const bg  = darkMode ? "bg-black text-white"   : "bg-gray-300 text-gray-900";
  const hdr = darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-200 border-gray-400";
  const inp = darkMode
    ? "bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-400"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500";

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${bg}`}>

      {/* ── Top search bar ───────────────────────────────── */}
      <div className={`flex items-center gap-2 px-4 py-2 border-b ${hdr} shrink-0 flex-wrap`}>
        <span className="text-xl mr-1">✈</span>
        <span className={`text-sm font-bold tracking-widest uppercase mr-3 hidden sm:block ${
          darkMode ? "text-blue-400" : "text-blue-700"
        }`}>AEROmatic FIDS</span>

        <input
          className={`flex-1 min-w-[140px] max-w-xs px-3 py-1.5 rounded border text-sm font-mono uppercase transition-colors outline-none ${inp}`}
          placeholder="Registration or callsign…"
          value={query}
          onChange={e => setQuery(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
        />

        <button
          onClick={handleSearch} disabled={loading}
          className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold tracking-wider transition-colors"
        >
          {loading ? "…" : "SEARCH"}
        </button>

        <button
          onClick={handleRandom} disabled={loading}
          className="px-4 py-1.5 rounded bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-bold tracking-wider transition-colors"
        >
          🎲 RANDOM
        </button>

        {isEmergency && (
          <span className="px-3 py-1 rounded font-bold text-xs tracking-widest text-white bg-red-700 animate-pulse">
            ⚠ SQUAWK {squawk} EMERGENCY
          </span>
        )}

        <div className="flex-1" />

        {lastUpdate && (
          <span className={`text-[10px] font-mono hidden sm:block ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
            ⟳ {lastUpdate.toLocaleTimeString()}
          </span>
        )}

        <button
          onClick={() => setDarkMode(d => !d)}
          className={`px-3 py-1.5 rounded border text-sm font-semibold transition-colors ${
            darkMode
              ? "border-gray-600 bg-gray-800 hover:bg-gray-700 text-yellow-300"
              : "border-gray-400 bg-white hover:bg-gray-100 text-gray-700"
          }`}
        >
          {darkMode ? "☀ Light" : "☾ Dark"}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="shrink-0 px-4 py-1.5 bg-red-900 border-b border-red-700 text-red-300 text-sm flex items-center justify-between">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white ml-4">✕</button>
        </div>
      )}

      {/* Empty / loading state */}
      {!flightData && !loading && !error && (
        <div className={`flex-1 flex flex-col items-center justify-center gap-4 ${
          darkMode ? "text-gray-600" : "text-gray-400"
        }`}>
          <span className="text-7xl select-none">✈</span>
          <p className="text-xl font-light tracking-widest uppercase">Enter a registration or press Random</p>
          <p className="text-sm opacity-60">e.g. N12345 · G-BOAC · BAW123</p>
          <button
            onClick={handleRandom} disabled={loading}
            className="mt-2 px-8 py-2 rounded-full bg-purple-700 hover:bg-purple-600 text-white font-bold tracking-widest text-sm disabled:opacity-50"
          >
            🎲 Load a random aircraft
          </button>
        </div>
      )}

      {loading && !flightData && (
        <div className={`flex-1 flex flex-col items-center justify-center gap-3 ${
          darkMode ? "text-gray-400" : "text-gray-500"
        }`}>
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm tracking-widest uppercase">Fetching flight data…</p>
        </div>
      )}

      {/* Flight info panel (top ~20%) */}
      {flightData && (
        <FlightInfoPanel
          flightData={flightData}
          darkMode={darkMode}
          lastUpdate={lastUpdate}
          onOpenMetar={() => setShowMetar(true)}
        />
      )}

      {/* Instrument panel (remaining ~80%) */}
      {flightData && (
        <InstrumentPanel values={instruments} darkMode={darkMode} />
      )}

      {/* Bottom bar: METAR button + squawk */}
      {flightData && (
        <div className={`shrink-0 border-t px-4 py-2 flex items-center gap-3 flex-wrap ${
          darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-200 border-gray-400"
        }`}>
          <button
            onClick={() => { setMetarAirport(""); setShowMetar(true); }}
            className="flex items-center gap-2 px-4 py-1.5 rounded bg-sky-700 hover:bg-sky-600 text-white text-sm font-bold tracking-wider transition-colors"
          >
            ⛅ METAR Weather Report
          </button>

          <span className={`text-[10px] font-mono uppercase tracking-wider ${
            darkMode ? "text-gray-600" : "text-gray-400"
          }`}>
            Enter any ICAO airport code · e.g. KJFK · EGLL · OMDB
          </span>

          <div className="flex-1" />

          {/* Squawk display */}
          {flightData.state?.squawk && (
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase tracking-wider font-semibold ${
                darkMode ? "text-gray-500" : "text-gray-500"
              }`}>XPDR</span>
              <span
                className={`px-3 py-1 rounded font-bold font-mono text-sm tracking-widest border transition-all ${
                  isEmergency
                    ? "bg-red-700 border-red-400 text-white animate-pulse"
                    : darkMode
                      ? "bg-gray-800 border-gray-600 text-gray-200"
                      : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                {flightData.state.squawk}
                {flightData.state.squawk === "7500" && " ⚠ HIJACK"}
                {flightData.state.squawk === "7600" && " ⚠ RADIO FAIL"}
                {flightData.state.squawk === "7700" && " ⚠ EMERGENCY"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* METAR modal */}
      <MetarModal
        isOpen={showMetar}
        onClose={() => setShowMetar(false)}
        defaultAirport={metarAirport}
        darkMode={darkMode}
      />
    </div>
  );
}
