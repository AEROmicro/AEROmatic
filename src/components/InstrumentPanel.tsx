"use client";
import React from "react";
import AirspeedIndicator      from "./instruments/AirspeedIndicator";
import AttitudeIndicator      from "./instruments/AttitudeIndicator";
import Altimeter              from "./instruments/Altimeter";
import HeadingIndicator       from "./instruments/HeadingIndicator";
import VerticalSpeedIndicator from "./instruments/VerticalSpeedIndicator";
import TurnCoordinator        from "./instruments/TurnCoordinator";
import EngineGauge            from "./instruments/EngineGauge";
import FuelGauge              from "./instruments/FuelGauge";
import FlapIndicator          from "./instruments/FlapIndicator";
import OATGauge               from "./instruments/OATGauge";
import MachMeter              from "./instruments/MachMeter";
import AOAIndicator           from "./instruments/AOAIndicator";
import GMeter                 from "./instruments/GMeter";
import { InstrumentValues }   from "@/types/flight";

interface Props {
  values: InstrumentValues;
  darkMode: boolean;
}

/** Wraps a single instrument with bezel padding + label underneath */
function Gauge({
  children,
  label,
  darkMode,
  small = false,
}: {
  children: React.ReactNode;
  label: string;
  darkMode: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`rounded-full p-1 shadow-inner ${
          darkMode ? "shadow-black/60" : "shadow-black/20"
        }`}
        style={{
          background: darkMode
            ? "radial-gradient(circle at 50% 50%, #1a1a2e 0%, #0d0d14 100%)"
            : "radial-gradient(circle at 50% 50%, #888 0%, #555 100%)",
          width:  small ? "140px" : "100%",
          aspectRatio: "1",
        }}
      >
        {children}
      </div>
      <span
        className={`text-[9px] uppercase tracking-widest font-semibold ${
          darkMode ? "text-gray-500" : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export default function InstrumentPanel({ values, darkMode }: Props) {
  const {
    airspeed_kts, altitude_ft, vsi_fpm, heading_deg,
    pitch_deg, bank_deg, n1_pct, egt_c, fuel_lbs,
    flap_pos, oat_c, mach, aoa_deg, g_force, slip,
  } = values;

  const panelBg = darkMode
    ? "bg-gradient-to-b from-gray-900 via-gray-950 to-black"
    : "bg-gradient-to-b from-gray-600 via-gray-500 to-gray-600";

  return (
    <div className={`w-full flex-1 overflow-y-auto ${panelBg} px-3 py-3`}>

      {/* ── Primary Six-Pack Row ──────────────────────────────── */}
      <div className="mb-1">
        <p className={`text-[9px] uppercase tracking-[0.25em] mb-1 px-1 ${
          darkMode ? "text-gray-600" : "text-gray-400"
        }`}>Primary Flight Instruments</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <Gauge label="Airspeed" darkMode={darkMode}>
            <AirspeedIndicator airspeed={airspeed_kts} darkMode={darkMode} />
          </Gauge>
          <Gauge label="Attitude" darkMode={darkMode}>
            <AttitudeIndicator pitch={pitch_deg} bank={bank_deg} darkMode={darkMode} />
          </Gauge>
          <Gauge label="Altimeter" darkMode={darkMode}>
            <Altimeter altitude={altitude_ft} darkMode={darkMode} />
          </Gauge>
          <Gauge label="Heading" darkMode={darkMode}>
            <HeadingIndicator heading={heading_deg} darkMode={darkMode} />
          </Gauge>
          <Gauge label="Vert Speed" darkMode={darkMode}>
            <VerticalSpeedIndicator vsi={vsi_fpm} darkMode={darkMode} />
          </Gauge>
          <Gauge label="Turn Coord" darkMode={darkMode}>
            <TurnCoordinator bank={bank_deg} slip={slip} darkMode={darkMode} />
          </Gauge>
        </div>
      </div>

      {/* ── Secondary Row: Pitch / Yaw / G / AOA / Mach / OAT ── */}
      <div className="mb-1">
        <p className={`text-[9px] uppercase tracking-[0.25em] mb-1 px-1 ${
          darkMode ? "text-gray-600" : "text-gray-400"
        }`}>Flight Performance Instruments</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <Gauge label="AOA" darkMode={darkMode}>
            <AOAIndicator aoa={aoa_deg} darkMode={darkMode} />
          </Gauge>
          <Gauge label="G-Force" darkMode={darkMode}>
            <GMeter gForce={g_force} darkMode={darkMode} />
          </Gauge>
          <Gauge label="Mach" darkMode={darkMode}>
            <MachMeter mach={mach} darkMode={darkMode} />
          </Gauge>
          <Gauge label="OAT" darkMode={darkMode}>
            <OATGauge oat={oat_c} darkMode={darkMode} />
          </Gauge>
          <Gauge label="Fuel" darkMode={darkMode}>
            <FuelGauge fuelPct={fuel_lbs} label="FUEL" darkMode={darkMode} />
          </Gauge>
          <Gauge label="Flaps" darkMode={darkMode}>
            <FlapIndicator flapDeg={flap_pos} darkMode={darkMode} />
          </Gauge>
        </div>
      </div>

      {/* ── Engine Row ────────────────────────────────────────── */}
      <div>
        <p className={`text-[9px] uppercase tracking-[0.25em] mb-1 px-1 ${
          darkMode ? "text-gray-600" : "text-gray-400"
        }`}>Engine Instruments</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Gauge label="Engine 1 N1" darkMode={darkMode}>
            <EngineGauge
              value={n1_pct} label="N1" unit="%" min={0} max={110}
              greenStart={70} greenEnd={100} yellowStart={100} yellowEnd={105} redLine={105}
              darkMode={darkMode}
            />
          </Gauge>
          <Gauge label="Engine 2 N1" darkMode={darkMode}>
            <EngineGauge
              value={n1_pct} label="N1" unit="%" min={0} max={110}
              greenStart={70} greenEnd={100} yellowStart={100} yellowEnd={105} redLine={105}
              darkMode={darkMode}
            />
          </Gauge>
          <Gauge label="Engine 1 EGT" darkMode={darkMode}>
            <EngineGauge
              value={egt_c} label="EGT" unit="°C" min={0} max={1000}
              greenStart={400} greenEnd={800} yellowStart={800} yellowEnd={900} redLine={920}
              darkMode={darkMode}
            />
          </Gauge>
          <Gauge label="Engine 2 EGT" darkMode={darkMode}>
            <EngineGauge
              value={egt_c} label="EGT" unit="°C" min={0} max={1000}
              greenStart={400} greenEnd={800} yellowStart={800} yellowEnd={900} redLine={920}
              darkMode={darkMode}
            />
          </Gauge>
        </div>
      </div>

    </div>
  );
}
