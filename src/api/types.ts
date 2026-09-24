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
  visibility?: number
  wind: { speed: number; deg: number; gust?: number }
  clouds: { all: number }
  dt: number
  sys: { country?: string; sunrise: number; sunset: number }
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
