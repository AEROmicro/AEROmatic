import { NextResponse } from "next/server";
import { ADSB_BASE } from "@/lib/adsb";
import { OPENSKY_BASE, openskyHeaders } from "@/lib/opensky";

export const runtime = 'edge';

// Mid-Atlantic / Europe bounding box — dense air traffic
const BBOX = "lamax=60&lamin=30&lomax=40&lomin=-30";

export async function GET() {
  try {
    // Fire both sources in parallel
    const [adsbRes, osRes] = await Promise.allSettled([
      fetch(`${ADSB_BASE}/bounds?${BBOX}`, { next: { revalidate: 10 } }),
      fetch(`${OPENSKY_BASE}/states/all?lamin=30&lomin=-30&lamax=60&lomax=40`, {
        next: { revalidate: 10 },
        headers: openskyHeaders(),
      }),
    ]);

    // adsb.fi primary — units: gs=knots, alt_baro may be "ground" string
    if (adsbRes.status === "fulfilled" && adsbRes.value.ok) {
      const data = await adsbRes.value.json() as { ac?: Record<string, unknown>[] };
      const airborne = (data.ac ?? []).filter(
        (ac) =>
          ac.alt_baro !== "ground" &&
          ac.lat != null &&
          ac.lon != null &&
          ac.gs != null &&
          (ac.gs as number) > 100  // > ~100 knots
      );
      if (airborne.length > 0) {
        const ac = airborne[Math.floor(Math.random() * airborne.length)];
        return NextResponse.json({ icao24: (ac.hex as string).toLowerCase() });
      }
    }

    // OpenSky fallback — units: velocity=m/s
    if (osRes.status === "fulfilled" && osRes.value.ok) {
      const data = await osRes.value.json() as { states?: unknown[][] };
      const airborne = (data.states ?? []).filter(
        (s) =>
          s[8] === false &&       // not on ground
          s[5] != null &&         // has longitude
          s[6] != null &&         // has latitude
          s[9] != null &&         // has velocity
          (s[9] as number) > 50   // > 50 m/s (~100 kts)
      );
      if (airborne.length > 0) {
        const s = airborne[Math.floor(Math.random() * airborne.length)];
        return NextResponse.json({ icao24: (s[0] as string).toLowerCase() });
      }
    }

    return NextResponse.json({ error: "No suitable aircraft found" }, { status: 404 });
  } catch (err) {
    console.error("Random API error:", err);
    return NextResponse.json({ error: "Failed to fetch random aircraft" }, { status: 500 });
  }
}
