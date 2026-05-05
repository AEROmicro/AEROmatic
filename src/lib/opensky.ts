/** Shared OpenSky Network helpers */

export const OPENSKY_BASE = "https://opensky-network.org/api";

/**
 * Returns headers for OpenSky API requests.
 * If OPENSKY_USERNAME and OPENSKY_PASSWORD env vars are set, HTTP Basic Auth
 * is included so that authenticated rate-limits and metadata endpoints work.
 */
export function openskyHeaders(): HeadersInit {
  const user = process.env.OPENSKY_USERNAME;
  const pass = process.env.OPENSKY_PASSWORD;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (user && pass) {
    if (user.includes(":")) {
      throw new Error("OPENSKY_USERNAME must not contain a colon character");
    }
    const encoded =
      typeof Buffer !== "undefined"
        ? Buffer.from(`${user}:${pass}`).toString("base64")
        : btoa(`${user}:${pass}`);
    headers["Authorization"] = `Basic ${encoded}`;
  }
  return headers;
}
