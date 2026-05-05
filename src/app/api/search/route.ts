import { NextRequest, NextResponse } from "next/server";
import { ADSB_BASE } from "@/lib/adsb";
import { openskyHeaders } from "@/lib/opensky";

export const runtime = 'edge';

const OS_META_BASE = "https://opensky-network.org/api/metadata/aircraft/registration";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toUpperCase();
  if (!q) {
    return NextResponse.json({ error: "Missing query parameter q" }, { status: 400 });
  }

  try {
    // Fire adsb.fi (registration + callsign) and OpenSky registration simultaneously
    const [adsbRegRes, adsbCallsignRes, osRegRes] = await Promise.allSettled([
      fetch(`${ADSB_BASE}/registration/${encodeURIComponent(q)}`, { next: { revalidate: 30 } }),
      fetch(`${ADSB_BASE}/callsign/${encodeURIComponent(q)}`, { next: { revalidate: 10 } }),
      fetch(`${OS_META_BASE}/${encodeURIComponent(q)}`, {
        next: { revalidate: 3600 },
        headers: openskyHeaders(),
      }),
    ]);

    // adsb.fi registration match (primary)
    if (adsbRegRes.status === "fulfilled" && adsbRegRes.value.ok) {
      const data = await adsbRegRes.value.json() as { ac?: Record<string, unknown>[] };
      const ac = data.ac?.[0];
      if (ac?.hex) {
        return NextResponse.json({
          icao24: (ac.hex as string).toLowerCase(),
          registration: (ac.r as string) ?? q,
        });
      }
    }

    // adsb.fi callsign match (primary)
    if (adsbCallsignRes.status === "fulfilled" && adsbCallsignRes.value.ok) {
      const data = await adsbCallsignRes.value.json() as { ac?: Record<string, unknown>[] };
      const ac = data.ac?.[0];
      if (ac?.hex) {
        return NextResponse.json({
          icao24: (ac.hex as string).toLowerCase(),
          callsign: ((ac.flight as string) ?? q).trim(),
        });
      }
    }

    // OpenSky registration fallback
    if (osRegRes.status === "fulfilled" && osRegRes.value.ok) {
      const meta = await osRegRes.value.json() as Record<string, string>;
      if (meta.icao24) {
        return NextResponse.json({
          icao24: meta.icao24.toLowerCase(),
          registration: meta.registration ?? q,
        });
      }
    }

    return NextResponse.json(
      { error: "No aircraft found matching that registration or callsign" },
      { status: 404 }
    );
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
