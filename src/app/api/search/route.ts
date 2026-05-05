import { NextRequest, NextResponse } from "next/server";
import { ADSB_BASE } from "@/lib/adsb";

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toUpperCase();
  if (!q) {
    return NextResponse.json({ error: "Missing query parameter q" }, { status: 400 });
  }

  try {
    // Search by registration and callsign simultaneously
    const [regRes, callsignRes] = await Promise.allSettled([
      fetch(`${ADSB_BASE}/registration/${encodeURIComponent(q)}`, { next: { revalidate: 30 } }),
      fetch(`${ADSB_BASE}/callsign/${encodeURIComponent(q)}`, { next: { revalidate: 10 } }),
    ]);

    // Prefer registration match
    if (regRes.status === "fulfilled" && regRes.value.ok) {
      const data = await regRes.value.json() as { ac?: Record<string, unknown>[] };
      const ac = data.ac?.[0];
      if (ac?.hex) {
        return NextResponse.json({
          icao24: (ac.hex as string).toLowerCase(),
          registration: (ac.r as string) ?? q,
        });
      }
    }

    // Fall back to callsign match
    if (callsignRes.status === "fulfilled" && callsignRes.value.ok) {
      const data = await callsignRes.value.json() as { ac?: Record<string, unknown>[] };
      const ac = data.ac?.[0];
      if (ac?.hex) {
        return NextResponse.json({
          icao24: (ac.hex as string).toLowerCase(),
          callsign: ((ac.flight as string) ?? q).trim(),
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
