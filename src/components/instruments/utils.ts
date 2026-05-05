/** Shared SVG geometry helpers for all round-dial instruments */

/** Convert bearing angle (0=top/North, clockwise) to SVG x,y on circle of radius r centred at (cx, cy) */
export function polar(cx: number, cy: number, r: number, bearing: number) {
  const rad = (bearing * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

/**
 * Describe a clockwise arc path segment from startBearing to endBearing.
 * Works even when the arc crosses the 0°/360° boundary.
 */
export function arcPath(
  cx: number,
  cy: number,
  r: number,
  startBearing: number,
  endBearing: number
): string {
  const start = polar(cx, cy, r, startBearing);
  const end = polar(cx, cy, r, endBearing);
  const delta = ((endBearing - startBearing) + 360) % 360;
  const large = delta > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

/** Map a value in [minVal, maxVal] to a bearing in [startBearing, startBearing + arcDeg] */
export function valueToBearing(
  value: number,
  minVal: number,
  maxVal: number,
  startBearing: number,
  arcDeg: number
): number {
  const clamped = Math.min(Math.max(value, minVal), maxVal);
  return startBearing + ((clamped - minVal) / (maxVal - minVal)) * arcDeg;
}
