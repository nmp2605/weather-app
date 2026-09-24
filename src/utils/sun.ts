/** Fraction of daylight elapsed (0 at sunrise, 1 at sunset), or null at night. */
export function daylightProgress(now: number, sunrise: number, sunset: number): number | null {
  if (sunset <= sunrise || now < sunrise || now > sunset) return null
  return (now - sunrise) / (sunset - sunrise)
}

export interface ArcPoint {
  x: number
  y: number
}

/**
 * Point on the half-circle drawn by SunCard (viewBox 0 0 200 110, center 100/100,
 * radius 90). Progress 0 is the left horizon, 1 the right one.
 */
export function arcPoint(progress: number, radius = 90, cx = 100, cy = 100): ArcPoint {
  const angle = Math.PI * (1 - progress)
  return {
    x: Number((cx + radius * Math.cos(angle)).toFixed(1)),
    y: Number((cy - radius * Math.sin(angle)).toFixed(1)),
  }
}
