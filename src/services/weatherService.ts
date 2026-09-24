import { fetchCurrentWeather, fetchForecast, reverseGeocode, searchCities } from '@/api/openWeather'
import type { OwmCurrentResponse } from '@/api/types'
import { SEARCH_RESULT_LIMIT } from '@/config/constants'
import { buildReport, toLocation } from '@/domain/mappers'
import type { Coordinates, Location, LocationRequest, WeatherReport } from '@/domain/types'

async function describePlace(coords: Coordinates, signal?: AbortSignal) {
  try {
    const result = await reverseGeocode(coords, signal)
    return result ? toLocation(result) : undefined
  } catch {
    return undefined
  }
}

function fallbackLocation(coords: Coordinates, current: OwmCurrentResponse): Location {
  return {
    name: current.name,
    country: current.sys.country ?? '',
    lat: coords.lat,
    lon: coords.lon,
  }
}

export async function getWeatherReport(
  { coords, location }: LocationRequest,
  signal?: AbortSignal,
): Promise<WeatherReport> {
  const [current, forecast, place] = await Promise.all([
    fetchCurrentWeather(coords, signal),
    fetchForecast(coords, signal),
    location ?? describePlace(coords, signal),
  ])

  return buildReport(place ?? fallbackLocation(coords, current), current, forecast)
}

export async function findCities(query: string, signal?: AbortSignal): Promise<Location[]> {
  const results = await searchCities(query, SEARCH_RESULT_LIMIT, signal)
  const seen = new Set<string>()

  return results.map(toLocation).filter((location) => {
    const key = [location.name, location.state, location.country].join('|').toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
