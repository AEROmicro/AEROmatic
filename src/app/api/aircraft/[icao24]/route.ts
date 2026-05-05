import { NextRequest, NextResponse } from "next/server";
import { ADSB_BASE, HEXDB_BASE } from "@/lib/adsb";
import { OPENSKY_BASE, openskyHeaders } from "@/lib/opensky";

export const runtime = 'edge';

const OS_META_BASE = "https://opensky-network.org/api/metadata/aircraft/icao";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ icao24: string }> }
) {
  const icao24 = (await params).icao24.toLowerCase();

  try {
    // Fire all four sources in parallel: two for state, two for metadata
    const [adsbRes, osStateRes, hexRes, osMetaRes] = await Promise.allSettled([
      fetch(`${ADSB_BASE}/icao/${icao24}`, { next: { revalidate: 10 } }),
      fetch(`${OPENSKY_BASE}/states/all?icao24=${icao24}`, {
        next: { revalidate: 10 },
        headers: openskyHeaders(),
      }),
      fetch(`${HEXDB_BASE}/aircraft/${icao24}`, { next: { revalidate: 3600 } }),
      fetch(`${OS_META_BASE}/${icao24}`, {
        next: { revalidate: 3600 },
        headers: openskyHeaders(),
      }),
    ]);

    // ── State: adsb.fi primary ───────────────────────────────────────────────
    // adsb.fi units: gs=knots, alt_baro/alt_geom=feet, baro_rate=ft/min
    // AircraftState interface expects: velocity=m/s, altitudes=metres, vertical_rate=m/s
    let adsbAc: Record<string, unknown> | null = null;
    let state = null;

    if (adsbRes.status === "fulfilled" && adsbRes.value.ok) {
      const json = await adsbRes.value.json();
      adsbAc = (json.ac as Record<string, unknown>[])?.[0] ?? null;
      if (adsbAc) {
        const altBaroRaw = adsbAc.alt_baro;
        state = {
          icao24: (adsbAc.hex as string | null | undefined) ?? icao24,
          callsign: ((adsbAc.flight as string) ?? "").trim(),
          origin_country: "",
          time_position: adsbAc.seen_pos != null
            ? Math.floor(Date.now() / 1000) - (adsbAc.seen_pos as number)
            : null,
          last_contact: adsbAc.seen != null
            ? Math.floor(Date.now() / 1000) - (adsbAc.seen as number)
            : Math.floor(Date.now() / 1000),
          longitude: (adsbAc.lon as number) ?? null,
          latitude: (adsbAc.lat as number) ?? null,
          baro_altitude: typeof altBaroRaw === "number" ? altBaroRaw * 0.3048 : null,
          on_ground: altBaroRaw === "ground",
          velocity: adsbAc.gs != null ? (adsbAc.gs as number) * 0.514444 : null,
          true_track: (adsbAc.track as number) ?? null,
          vertical_rate: adsbAc.baro_rate != null ? (adsbAc.baro_rate as number) * 0.00508 : null,
          geo_altitude: adsbAc.alt_geom != null ? (adsbAc.alt_geom as number) * 0.3048 : null,
          squawk: (adsbAc.squawk as string) ?? null,
        };
      }
    }

    // ── State: OpenSky fallback (SI units, used only when adsb.fi has no data) ──
    if (!state && osStateRes.status === "fulfilled" && osStateRes.value.ok) {
      const json = await osStateRes.value.json() as { states?: unknown[][] };
      const s = json.states?.[0];
      if (s) {
        state = {
          icao24: s[0] as string,
          callsign: ((s[1] as string) ?? "").trim(),
          origin_country: (s[2] as string) ?? "",
          time_position: s[3] as number | null,
          last_contact: s[4] as number,
          longitude: s[5] as number | null,
          latitude: s[6] as number | null,
          baro_altitude: s[7] as number | null,
          on_ground: s[8] as boolean,
          velocity: s[9] as number | null,
          true_track: s[10] as number | null,
          vertical_rate: s[11] as number | null,
          geo_altitude: s[13] as number | null,
          squawk: s[14] as string | null,
        };
      }
    }

    // ── Meta: hexdb.io primary ───────────────────────────────────────────────
    let meta = null;

    if (hexRes.status === "fulfilled" && hexRes.value.ok) {
      const m = await hexRes.value.json() as Record<string, string>;
      if (m.Registration || m.Manufacturer || m.Type) {
        meta = {
          icao24,
          registration: m.Registration ?? null,
          manufacturerName: m.Manufacturer ?? null,
          model: m.Type ?? null,
          typecode: m.ICAOTypeCode ?? null,
          operator: m.RegisteredOwners ?? null,
          owner: m.RegisteredOwners ?? null,
        };
      }
    }

    // ── Meta: OpenSky fallback (used only when hexdb.io has no data) ─────────
    if (!meta && osMetaRes.status === "fulfilled" && osMetaRes.value.ok) {
      const m = await osMetaRes.value.json() as Record<string, string>;
      if (m.icao24 || m.registration) {
        meta = {
          icao24: m.icao24 ?? icao24,
          registration: m.registration ?? null,
          manufacturerName: m.manufacturerName ?? null,
          model: m.model ?? null,
          typecode: m.typecode ?? null,
          operator: m.operatorCallsign ?? m.operator ?? null,
          owner: m.owner ?? null,
        };
      }
    }

    // ── Meta: last resort — inline registration/type carried by adsb.fi ──────
    // adsb.fi `r` = registration, `t` = ICAO type code (e.g. "B738").
    // Both `model` and `typecode` are set to `t` because adsb.fi only provides
    // the short type code; a richer model string is not available at this tier.
    if (!meta && adsbAc && (adsbAc.r != null || adsbAc.t != null)) {
      const reg = adsbAc.r != null ? (adsbAc.r as string) : null;
      const typeCode = adsbAc.t != null ? (adsbAc.t as string) : null;
      meta = {
        icao24,
        registration: reg,
        manufacturerName: null,
        model: typeCode,
        typecode: typeCode,
        operator: null,
        owner: null,
      };
    }

    if (!state && !meta) {
      return NextResponse.json(
        { error: "Aircraft not found or not currently tracked" },
        { status: 404 }
      );
    }

    return NextResponse.json({ state, meta });
  } catch (err) {
    console.error("Aircraft API error:", err);
    return NextResponse.json({ error: "Failed to fetch aircraft data" }, { status: 500 });
  }
}
