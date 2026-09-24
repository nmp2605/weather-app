import { toCondition } from './conditions'
import type { CurrentWeather, DailySummary, HourlyPoint, Location, WeatherReport } from './types'
import type {
  OwmCurrentResponse,
  OwmForecastItem,
  OwmForecastResponse,
  OwmGeocodingResult,
} from '@/api/types'
import { DAILY_DAYS, HOURLY_POINTS } from '@/config/constants'
import { localDateKey, localHour } from '@/utils/time'

const MS_TO_KMH = 3.6

export function toLocation(result: OwmGeocodingResult): Location {
  const location: Location = {
    name: result.local_names?.pt ?? result.name,
    country: result.country,
    lat: result.lat,
    lon: result.lon,
  }
  if (result.state) location.state = result.state
  return location
}

export function mapCurrent(raw: OwmCurrentResponse): CurrentWeather {
  return {
    temperature: raw.main.temp,
    feelsLike: raw.main.feels_like,
    humidity: raw.main.humidity,
    pressure: raw.main.pressure,
    visibilityKm: raw.visibility === undefined ? null : raw.visibility / 1000,
    windSpeedKmh: raw.wind.speed * MS_TO_KMH,
    windDeg: raw.wind.deg,
    cloudiness: raw.clouds.all,
    condition: toCondition(raw.weather[0]),
    observedAt: raw.dt,
    sunrise: raw.sys.sunrise,
    sunset: raw.sys.sunset,
  }
}

/** "Now" (current conditions) followed by the next 3-hour forecast steps. */
export function mapHourly(
  current: OwmCurrentResponse,
  forecast: OwmForecastResponse,
  points = HOURLY_POINTS,
): HourlyPoint[] {
  const upcoming = forecast.list.slice(0, points - 1).map((item) => ({
    time: item.dt,
    temperature: item.main.temp,
    condition: toCondition(item.weather[0]),
    precipitationChance: item.pop,
  }))

  const now: HourlyPoint = {
    time: current.dt,
    temperature: current.main.temp,
    condition: toCondition(current.weather[0]),
    precipitationChance: forecast.list[0]?.pop ?? 0,
  }

  return [now, ...upcoming]
}

type NonEmpty<T> = [T, ...T[]]

/** Picks the reading closest to local noon to represent the day's weather. */
function representative(items: NonEmpty<OwmForecastItem>, offset: number): OwmForecastItem {
  const distanceFromNoon = (item: OwmForecastItem) => Math.abs(localHour(item.dt, offset) - 12)
  let best = items[0]
  for (const item of items) {
    if (distanceFromNoon(item) < distanceFromNoon(best)) best = item
  }
  return best
}

export function mapDaily(
  current: OwmCurrentResponse,
  forecast: OwmForecastResponse,
  days = DAILY_DAYS,
): DailySummary[] {
  const offset = forecast.city.timezone
  const groups = new Map<string, NonEmpty<OwmForecastItem>>()

  for (const item of forecast.list) {
    const key = localDateKey(item.dt, offset)
    const group = groups.get(key)
    if (group) group.push(item)
    else groups.set(key, [item])
  }

  const today = localDateKey(current.dt, offset)

  return [...groups.entries()].slice(0, days).map(([date, items]) => {
    const temps = items.flatMap((item) => [item.main.temp_min, item.main.temp_max])
    // The forecast starts at the next 3-hour step, so today's range also includes "now".
    if (date === today) temps.push(current.main.temp)

    const chosen = representative(items, offset)
    return {
      date,
      time: chosen.dt,
      min: Math.min(...temps),
      max: Math.max(...temps),
      condition: toCondition(chosen.weather[0]),
      precipitationChance: Math.max(...items.map((item) => item.pop)),
    }
  })
}

export function buildReport(
  location: Location,
  current: OwmCurrentResponse,
  forecast: OwmForecastResponse,
): WeatherReport {
  return {
    location,
    timezoneOffset: current.timezone,
    current: mapCurrent(current),
    hourly: mapHourly(current, forecast),
    daily: mapDaily(current, forecast),
  }
}
