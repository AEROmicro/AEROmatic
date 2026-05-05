export interface AircraftState {
  icao24: string;
  callsign: string;
  origin_country: string;
  time_position: number | null;
  last_contact: number;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null; // metres
  on_ground: boolean;
  velocity: number | null;       // m/s
  true_track: number | null;     // degrees true
  vertical_rate: number | null;  // m/s
  geo_altitude: number | null;   // metres
  squawk: string | null;
}

export interface AircraftMeta {
  icao24: string;
  registration: string | null;
  manufacturerName: string | null;
  model: string | null;
  typecode: string | null;
  operator: string | null;
  owner: string | null;
}

export interface FlightData {
  state: AircraftState | null;
  meta: AircraftMeta | null;
}

/** All values in aviation units ready to drive instruments */
export interface InstrumentValues {
  airspeed_kts: number;    // knots
  altitude_ft: number;     // feet
  vsi_fpm: number;         // ft/min
  heading_deg: number;     // 0-359°
  pitch_deg: number;       // estimated degrees
  bank_deg: number;        // estimated degrees
  slip: number;            // slip/skid -1..+1
  n1_pct: number;          // engine N1 % (simulated)
  n2_pct: number;          // engine N2 % (simulated)
  egt_c: number;           // EGT °C (simulated)
  fuel_lbs: number;        // fuel % (simulated, 0-100)
  flap_pos: number;        // 0-40 degrees (simulated)
  oat_c: number;           // outside air temp °C (estimated)
  mach: number;            // Mach number (derived)
  aoa_deg: number;         // angle of attack degrees (estimated)
  g_force: number;         // G load (estimated)
}
