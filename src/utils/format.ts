const LOCALE = 'pt-BR'

const regionNames = new Intl.DisplayNames([LOCALE], { type: 'region' })

export function formatTemperature(celsius: number): string {
  // `|| 0` turns -0 (from values like -0.4) into 0.
  return `${Math.round(celsius) || 0}°`
}

export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits }).format(value)
}

/** 0.7 → "70%" */
export function formatChance(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}

/** "BR" → "Brasil"; unknown or empty codes are returned as-is. */
export function countryName(code: string): string {
  if (!code) return ''
  try {
    return regionNames.of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const COMPASS = [
  { short: 'N', long: 'norte' },
  { short: 'NE', long: 'nordeste' },
  { short: 'L', long: 'leste' },
  { short: 'SE', long: 'sudeste' },
  { short: 'S', long: 'sul' },
  { short: 'SO', long: 'sudoeste' },
  { short: 'O', long: 'oeste' },
  { short: 'NO', long: 'noroeste' },
] as const

export type CompassPoint = (typeof COMPASS)[number]

/** Meteorological degrees (where the wind comes from) → 8-point compass in Portuguese. */
export function windDirection(degrees: number): CompassPoint {
  const normalized = ((degrees % 360) + 360) % 360
  return COMPASS[Math.round(normalized / 45) % COMPASS.length] ?? COMPASS[0]
}

/** Dew point in °C using the Magnus–Tetens approximation. */
export function dewPoint(celsius: number, humidity: number): number {
  const a = 17.62
  const b = 243.12
  const gamma = Math.log(Math.max(humidity, 1) / 100) + (a * celsius) / (b + celsius)
  return (b * gamma) / (a - gamma)
}
