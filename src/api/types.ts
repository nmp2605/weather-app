/** Raw response shapes of the OpenWeatherMap endpoints used by the app. */

export interface OwmCondition {
  id: number
  main: string
  description: string
  icon: string
}

export interface OwmCurrentResponse {
  coord: { lat: number; lon: number }
  weather: OwmCondition[]
  main: {
    temp: number
    feels_like: number
    temp_min: number
    temp_max: number
    pressure: number
    humidity: number
  }
  /** Meters, capped at 10 000 by the API. Missing for some stations. */
  visibility?: number
  /** Speed in m/s with `units=metric`; direction in meteorological degrees. */
  wind: { speed: number; deg: number; gust?: number }
  clouds: { all: number }
  dt: number
  sys: { country?: string; sunrise: number; sunset: number }
  /** Shift in seconds from UTC. */
  timezone: number
  name: string
}

export interface OwmForecastItem {
  dt: number
  main: {
    temp: number
    feels_like: number
    temp_min: number
    temp_max: number
    humidity: number
  }
  weather: OwmCondition[]
  /** Probability of precipitation, 0–1. */
  pop: number
}

export interface OwmForecastResponse {
  list: OwmForecastItem[]
  city: {
    name: string
    country: string
    timezone: number
    sunrise: number
    sunset: number
    coord: { lat: number; lon: number }
  }
}

export interface OwmGeocodingResult {
  name: string
  local_names?: Record<string, string>
  lat: number
  lon: number
  country: string
  state?: string
}
