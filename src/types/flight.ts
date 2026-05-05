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
  pitch_deg: number;       // estimated
  bank_deg: number;        // estimated
  n1_pct: number;          // engine N1 % (simulated)
  egt_c: number;           // EGT °C (simulated)
  fuel_lbs: number;        // fuel lbs (simulated)
  flap_pos: number;        // 0-40 degrees (simulated)
  oat_c: number;           // outside air temp °C (estimated)
}
