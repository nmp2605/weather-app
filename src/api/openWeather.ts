import { http } from './client'
import { isAbortError, toWeatherApiError } from './errors'
import type { OwmCurrentResponse, OwmForecastResponse, OwmGeocodingResult } from './types'
import type { Coordinates } from '@/domain/types'

const WEATHER_PARAMS = { units: 'metric', lang: 'pt_br' } as const

async function get<T>(url: string, params: Record<string, unknown>, signal?: AbortSignal) {
  try {
    const { data } = await http.get<T>(url, { params, signal })
    return data
  } catch (error) {
    if (isAbortError(error)) throw error
    throw toWeatherApiError(error)
  }
}

export function fetchCurrentWeather(
  { lat, lon }: Coordinates,
  signal?: AbortSignal,
): Promise<OwmCurrentResponse> {
  return get('/data/2.5/weather', { lat, lon, ...WEATHER_PARAMS }, signal)
}

export function fetchForecast(
  { lat, lon }: Coordinates,
  signal?: AbortSignal,
): Promise<OwmForecastResponse> {
  return get('/data/2.5/forecast', { lat, lon, ...WEATHER_PARAMS }, signal)
}

export function searchCities(
  query: string,
  limit: number,
  signal?: AbortSignal,
): Promise<OwmGeocodingResult[]> {
  return get('/geo/1.0/direct', { q: query, limit }, signal)
}

export async function reverseGeocode(
  { lat, lon }: Coordinates,
  signal?: AbortSignal,
): Promise<OwmGeocodingResult | undefined> {
  const results = await get<OwmGeocodingResult[]>(
    '/geo/1.0/reverse',
    { lat, lon, limit: 1 },
    signal,
  )
  return results[0]
}
