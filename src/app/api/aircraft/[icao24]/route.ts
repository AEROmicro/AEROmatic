import { NextRequest, NextResponse } from "next/server";

const OPENSKY_BASE = "https://opensky-network.org/api";
const META_BASE = "https://opensky-network.org/api/metadata/aircraft/icao";

export async function GET(
  _req: NextRequest,
  { params }: { params: { icao24: string } }
) {
  const icao24 = params.icao24.toLowerCase();

  try {
    const [stateRes, metaRes] = await Promise.allSettled([
      fetch(`${OPENSKY_BASE}/states/all?icao24=${icao24}`, {
        next: { revalidate: 10 },
        headers: { "Accept": "application/json" },
      }),
      fetch(`${META_BASE}/${icao24}`, {
        next: { revalidate: 3600 },
        headers: { "Accept": "application/json" },
      }),
    ]);

    let state = null;
    if (stateRes.status === "fulfilled" && stateRes.value.ok) {
      const json = await stateRes.value.json();
      if (json.states && json.states.length > 0) {
        const s = json.states[0];
        state = {
          icao24: s[0],
          callsign: (s[1] ?? "").trim(),
          origin_country: s[2] ?? "",
          time_position: s[3],
          last_contact: s[4],
          longitude: s[5],
          latitude: s[6],
          baro_altitude: s[7],
          on_ground: s[8],
          velocity: s[9],
          true_track: s[10],
          vertical_rate: s[11],
          geo_altitude: s[13],
          squawk: s[14],
        };
      }
    }

    let meta = null;
    if (metaRes.status === "fulfilled" && metaRes.value.ok) {
      const m = await metaRes.value.json();
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
