import type {
  OwmCondition,
  OwmCurrentResponse,
  OwmForecastItem,
  OwmForecastResponse,
  OwmGeocodingResult,
} from '@/api/types'
import { buildReport } from '@/domain/mappers'
import type { Location, WeatherReport } from '@/domain/types'

export const SAO_PAULO_OFFSET = -3 * 3600

const unix = (iso: string) => Math.floor(Date.parse(iso) / 1000)

export const OBSERVED_AT = unix('2026-09-23T18:12:00Z')
export const SUNRISE = unix('2026-09-23T08:52:00Z')
export const SUNSET = unix('2026-09-23T21:01:00Z')
export const FORECAST_START = unix('2026-09-23T21:00:00Z')
const STEP = 3 * 3600

export const SAO_PAULO: Location = {
  name: 'São Paulo',
  state: 'São Paulo',
  country: 'BR',
  lat: -23.5505,
  lon: -46.6333,
}

function condition(id: number, description: string, icon = '04d'): OwmCondition {
  return { id, main: 'Clouds', description, icon }
}

export function makeCurrent(overrides: Partial<OwmCurrentResponse> = {}): OwmCurrentResponse {
  return {
    coord: { lat: SAO_PAULO.lat, lon: SAO_PAULO.lon },
    weather: [condition(804, 'nublado')],
    main: {
      temp: 23.4,
      feels_like: 24.1,
      temp_min: 21,
      temp_max: 25,
      pressure: 1016,
      humidity: 68,
    },
    visibility: 10_000,
    wind: { speed: 3.9, deg: 45 },
    clouds: { all: 75 },
    dt: OBSERVED_AT,
    sys: { country: 'BR', sunrise: SUNRISE, sunset: SUNSET },
    timezone: SAO_PAULO_OFFSET,
    name: 'São Paulo',
    ...overrides,
  }
}

function makeForecastItem(index: number): OwmForecastItem {
  const dt = FORECAST_START + index * STEP
  const temp = 15 + (index % 8)
  const localHour = new Date((dt + SAO_PAULO_OFFSET) * 1000).getUTCHours()
  const icon = localHour >= 6 && localHour < 18 ? 'd' : 'n'
  return {
    dt,
    main: { temp, feels_like: temp, temp_min: temp - 1, temp_max: temp + 1, humidity: 70 },
    weather: [
      index % 8 === 4
        ? condition(500, 'chuva leve', `10${icon}`)
        : condition(803, 'nublado', `04${icon}`),
    ],
    pop: (index % 5) / 10,
  }
}

export function makeForecast(count = 40): OwmForecastResponse {
  return {
    list: Array.from({ length: count }, (_, index) => makeForecastItem(index)),
    city: {
      name: 'São Paulo',
      country: 'BR',
      timezone: SAO_PAULO_OFFSET,
      sunrise: SUNRISE,
      sunset: SUNSET,
      coord: { lat: SAO_PAULO.lat, lon: SAO_PAULO.lon },
    },
  }
}

export function makeGeo(overrides: Partial<OwmGeocodingResult> = {}): OwmGeocodingResult {
  return {
    name: 'Florianopolis',
    local_names: { pt: 'Florianópolis' },
    lat: -27.5954,
    lon: -48.548,
    country: 'BR',
    state: 'Santa Catarina',
    ...overrides,
  }
}

export function makeReport(location: Location = SAO_PAULO): WeatherReport {
  return buildReport(location, makeCurrent(), makeForecast())
}
