import { NextRequest, NextResponse } from "next/server";
import { ADSB_BASE, HEXDB_BASE } from "@/lib/adsb";

export const runtime = 'edge';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ icao24: string }> }
) {
  const icao24 = (await params).icao24.toLowerCase();

  try {
    const [adsbRes, hexRes] = await Promise.allSettled([
      fetch(`${ADSB_BASE}/icao/${icao24}`, { next: { revalidate: 10 } }),
      fetch(`${HEXDB_BASE}/aircraft/${icao24}`, { next: { revalidate: 3600 } }),
    ]);

    // ── Live state from adsb.fi ──────────────────────────────────────────────
    // adsb.fi units: gs=knots, alt_baro/alt_geom=feet, baro_rate=ft/min
    // AircraftState interface expects: velocity=m/s, altitudes=metres, vertical_rate=m/s
    let adsbAc: Record<string, unknown> | null = null;
    let state = null;
    if (adsbRes.status === "fulfilled" && adsbRes.value.ok) {
      const json = await adsbRes.value.json();
      adsbAc = (json.ac as Record<string, unknown>[])?.[0] ?? null;
      if (adsbAc) {
        const altBaroRaw = adsbAc.alt_baro;
        const onGround = altBaroRaw === "ground";
        state = {
          icao24: (adsbAc.hex as string) ?? icao24,
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
          on_ground: onGround,
          velocity: adsbAc.gs != null ? (adsbAc.gs as number) * 0.514444 : null,
          true_track: (adsbAc.track as number) ?? null,
          vertical_rate: adsbAc.baro_rate != null ? (adsbAc.baro_rate as number) * 0.00508 : null,
          geo_altitude: adsbAc.alt_geom != null ? (adsbAc.alt_geom as number) * 0.3048 : null,
          squawk: (adsbAc.squawk as string) ?? null,
        };
      }
    }

    // ── Metadata from hexdb.io ───────────────────────────────────────────────
    let meta = null;
    if (hexRes.status === "fulfilled" && hexRes.value.ok) {
      const m = await hexRes.value.json() as Record<string, string>;
      if (m && (m.Registration || m.Manufacturer || m.Type)) {
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

    // Fall back to inline registration/type from adsb.fi if hexdb had nothing
    if (!meta && adsbAc && (adsbAc.r || adsbAc.t)) {
      meta = {
        icao24,
        registration: (adsbAc.r as string) ?? null,
        manufacturerName: null,
        model: (adsbAc.t as string) ?? null,
        typecode: (adsbAc.t as string) ?? null,
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
