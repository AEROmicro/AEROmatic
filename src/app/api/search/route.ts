import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

const OPENSKY_META = "https://opensky-network.org/api/metadata/aircraft/registration";
const OPENSKY_STATES = "https://opensky-network.org/api/states/all";

function openskyHeaders(): HeadersInit {
  const user = process.env.OPENSKY_USERNAME;
  const pass = process.env.OPENSKY_PASSWORD;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (user && pass) {
    headers["Authorization"] = "Basic " + btoa(`${user}:${pass}`);
  }
  return headers;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toUpperCase();
  if (!q) {
    return NextResponse.json({ error: "Missing query parameter q" }, { status: 400 });
  }

  try {
    // Try treating query as registration first (requires OpenSky credentials)
    const metaRes = await fetch(`${OPENSKY_META}/${encodeURIComponent(q)}`, {
      next: { revalidate: 3600 },
      headers: openskyHeaders(),
    });

    if (metaRes.ok) {
      const meta = await metaRes.json();
      if (meta.icao24) {
        return NextResponse.json({ icao24: meta.icao24.toLowerCase(), registration: meta.registration });
      }
    }

    // Fallback: search all live states by callsign
    const statesRes = await fetch(
      OPENSKY_STATES,
      { next: { revalidate: 10 }, headers: openskyHeaders() }
    );

    if (statesRes.status === 401 || statesRes.status === 403) {
      return NextResponse.json(
        { error: "OpenSky API requires credentials. Set OPENSKY_USERNAME and OPENSKY_PASSWORD." },
        { status: 502 }
      );
    }

    if (statesRes.status === 429) {
      return NextResponse.json(
        { error: "OpenSky API rate limit reached. Please wait and try again." },
        { status: 429 }
      );
    }

    if (statesRes.ok) {
      const data = await statesRes.json();
      if (data.states) {
        const match = data.states.find(
          (s: unknown[]) => typeof s[1] === "string" && s[1].trim().toUpperCase() === q
        );
        if (match) {
          return NextResponse.json({ icao24: (match[0] as string).toLowerCase(), callsign: (match[1] as string).trim() });
        }
      }
    }

    return NextResponse.json({ error: "No aircraft found matching that registration or callsign" }, { status: 404 });
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
