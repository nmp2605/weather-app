export interface Coordinates {
  lat: number
  lon: number
}

export interface Location extends Coordinates {
  name: string
  state?: string
  country: string
}

export type ConditionKind =
  'clear' | 'few-clouds' | 'clouds' | 'drizzle' | 'rain' | 'thunderstorm' | 'snow' | 'mist'

export interface Condition {
  kind: ConditionKind
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
  observedAt: number
  sunrise: number
  sunset: number
}

export interface HourlyPoint {
  time: number
  temperature: number
  condition: Condition
  precipitationChance: number
}

export interface DailySummary {
  date: string
  time: number
  min: number
  max: number
  condition: Condition
  precipitationChance: number
}

export interface WeatherReport {
  location: Location
  timezoneOffset: number
  current: CurrentWeather
  hourly: HourlyPoint[]
  daily: DailySummary[]
}

export interface LocationRequest {
  coords: Coordinates
  location?: Location
}

export type LocationSource = 'geolocation' | 'search' | 'saved' | 'default'
