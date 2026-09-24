export function daylightProgress(now: number, sunrise: number, sunset: number): number | null {
  if (sunset <= sunrise || now < sunrise || now > sunset) return null
  return (now - sunrise) / (sunset - sunrise)
}

export interface ArcPoint {
  x: number
  y: number
}

const ARC_RADIUS = 90
const ARC_CENTER = 100

export function arcPoint(progress: number): ArcPoint {
  const angle = Math.PI * (1 - progress)
  return {
    x: Number((ARC_CENTER + ARC_RADIUS * Math.cos(angle)).toFixed(1)),
    y: Number((ARC_CENTER - ARC_RADIUS * Math.sin(angle)).toFixed(1)),
  }
}
