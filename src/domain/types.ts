export interface Coordinates {
  lat: number
  lon: number
}

export interface Location extends Coordinates {
  name: string
  state?: string
  /** ISO 3166-1 alpha-2 code, e.g. "BR". Empty when the API does not report it. */
  country: string
}

export type ConditionKind =
  'clear' | 'few-clouds' | 'clouds' | 'drizzle' | 'rain' | 'thunderstorm' | 'snow' | 'mist'

export interface Condition {
  kind: ConditionKind
  /** Localized description from the API, e.g. "nublado". */
  description: string
  isNight: boolean
}

export interface CurrentWeather {
  temperature: number
  feelsLike: number
  humidity: number
  pressure: number
  visibilityKm: number | null
  windSpeedKmh: number
  windDeg: number
  cloudiness: number
  condition: Condition
  /** Unix seconds. */
  observedAt: number
  sunrise: number
  sunset: number
}

export interface HourlyPoint {
  /** Unix seconds. */
  time: number
  temperature: number
  condition: Condition
  /** 0–1. */
  precipitationChance: number
}

export interface DailySummary {
  /** Local calendar date (YYYY-MM-DD) in the city's time zone. */
  date: string
  /** Unix seconds of the reading used for the day's condition. */
  time: number
  min: number
  max: number
  condition: Condition
  precipitationChance: number
}

export interface WeatherReport {
  location: Location
  /** City offset from UTC in seconds. */
  timezoneOffset: number
  current: CurrentWeather
  hourly: HourlyPoint[]
  daily: DailySummary[]
}

/** What the app asks weather for: coordinates, plus the place when it is already known. */
export interface LocationRequest {
  coords: Coordinates
  location?: Location
}

export type LocationSource = 'geolocation' | 'search' | 'saved' | 'default'
