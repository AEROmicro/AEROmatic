import { NextResponse } from "next/server";
import { OPENSKY_BASE, openskyHeaders } from "@/lib/opensky";

export const runtime = 'edge';

export async function GET() {
  try {
    // Fetch aircraft in a mid-Atlantic / Europe bounding box for high traffic density
    const res = await fetch(
      `${OPENSKY_BASE}/states/all?lamin=30&lomin=-30&lamax=60&lomax=40`,
      { next: { revalidate: 10 }, headers: openskyHeaders() }
    );

    if (res.status === 401 || res.status === 403) {
      return NextResponse.json(
        { error: "OpenSky API requires credentials. Set OPENSKY_USERNAME and OPENSKY_PASSWORD." },
        { status: 502 }
      );
    }

    if (res.status === 429) {
      return NextResponse.json(
        { error: "OpenSky API rate limit reached. Please wait and try again." },
        { status: 429 }
      );
    }

    if (!res.ok) {
      throw new Error(`OpenSky returned ${res.status}`);
    }

    const data = await res.json();
    if (!data.states || data.states.length === 0) {
      return NextResponse.json({ error: "No aircraft in region" }, { status: 404 });
    }

    // Filter: airborne only (not on ground), has position and velocity
    const airborne = data.states.filter(
      (s: unknown[]) =>
        s[8] === false &&   // not on ground
        s[5] !== null &&    // has longitude
        s[6] !== null &&    // has latitude
        s[9] !== null &&    // has velocity
        (s[9] as number) > 50 // more than 50 m/s (~100 kts)
    );

    if (airborne.length === 0) {
      return NextResponse.json({ error: "No suitable aircraft found" }, { status: 404 });
    }

    const s = airborne[Math.floor(Math.random() * airborne.length)];
    return NextResponse.json({ icao24: (s[0] as string).toLowerCase() });
  } catch (err) {
    console.error("Random API error:", err);
    return NextResponse.json({ error: "Failed to fetch random aircraft" }, { status: 500 });
  }
}
