import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

const AWC_BASE = "https://aviationweather.gov/api/data/metar";

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids")?.trim().toUpperCase();
  if (!ids) {
    return NextResponse.json({ error: "Missing airport ICAO (ids parameter)" }, { status: 400 });
  }

  try {
    const url = `${AWC_BASE}?ids=${encodeURIComponent(ids)}&format=json&hours=2`;
    const res = await fetch(url, {
      next: { revalidate: 300 }, // cache 5 min
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `METAR service returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: `No METAR found for ${ids}` },
        { status: 404 }
      );
    }

    const m = data[0];

    // Build a cleaned-up object from the AWC JSON fields
    const metar = {
      station:   m.icaoId ?? ids,
      raw:       m.rawOb  ?? "",
      time:      m.reportTime ?? "",
      temp_c:    m.temp   ?? null,
      dewpoint_c: m.dewp  ?? null,
      wind_dir:  m.wdir   ?? null,
      wind_speed_kt: m.wspd ?? null,
      wind_gust_kt:  m.wgst ?? null,
      visibility_sm: m.visib ?? null,
      altimeter_inhg: m.altim != null ? (m.altim / 33.8639).toFixed(2) : null,
      altimeter_hpa:  m.altim ?? null,
      wx_string:  m.wxString ?? null,
      sky_cover:  m.clouds ?? [],
      flight_category: m.flightCategory ?? null,
      ceiling_ft:  m.ceiling ?? null,
    };

    return NextResponse.json(metar);
  } catch (err) {
    console.error("METAR API error:", err);
    return NextResponse.json({ error: "Failed to fetch METAR" }, { status: 500 });
  }
}
