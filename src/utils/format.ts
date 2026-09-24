const LOCALE = 'pt-BR'

const regionNames = new Intl.DisplayNames([LOCALE], { type: 'region', fallback: 'none' })

export function formatTemperature(celsius: number): string {
  return `${Math.round(celsius) || 0}°`
}

export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits }).format(value)
}

export function formatChance(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}

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

interface CompassPoint {
  short: string
  long: string
}

type Octant = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

const COMPASS: Readonly<Record<Octant, CompassPoint>> = {
  0: { short: 'N', long: 'norte' },
  1: { short: 'NE', long: 'nordeste' },
  2: { short: 'L', long: 'leste' },
  3: { short: 'SE', long: 'sudeste' },
  4: { short: 'S', long: 'sul' },
  5: { short: 'SO', long: 'sudoeste' },
  6: { short: 'O', long: 'oeste' },
  7: { short: 'NO', long: 'noroeste' },
}

export function windDirection(degrees: number): CompassPoint {
  const normalized = ((degrees % 360) + 360) % 360
  return COMPASS[(Math.round(normalized / 45) % 8) as Octant]
}

export function dewPoint(celsius: number, humidity: number): number {
  const a = 17.62
  const b = 243.12
  const gamma = Math.log(Math.max(humidity, 1) / 100) + (a * celsius) / (b + celsius)
  return (b * gamma) / (a - gamma)
}
