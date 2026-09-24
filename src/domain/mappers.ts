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

function representative(items: NonEmpty<OwmForecastItem>, offset: number): OwmForecastItem {
  const distanceFromNoon = (item: OwmForecastItem) => Math.abs(localHour(item.dt, offset) - 12)
  let best = items[0]
  for (const item of items) {
    if (distanceFromNoon(item) < distanceFromNoon(best)) best = item
  }
  return best
}

function groupByLocalDate(items: OwmForecastItem[], offset: number) {
  const groups = new Map<string, NonEmpty<OwmForecastItem>>()
  for (const item of items) {
    const key = localDateKey(item.dt, offset)
    const group = groups.get(key)
    if (group) group.push(item)
    else groups.set(key, [item])
  }
  return groups
}

function summarizeDay(
  [date, items]: [string, NonEmpty<OwmForecastItem>],
  offset: number,
  extraTemps: number[],
): DailySummary {
  const temps = items.flatMap((item) => [item.main.temp_min, item.main.temp_max])
  const chosen = representative(items, offset)
  return {
    date,
    time: chosen.dt,
    min: Math.min(...temps, ...extraTemps),
    max: Math.max(...temps, ...extraTemps),
    condition: toCondition(chosen.weather[0]),
    precipitationChance: Math.max(...items.map((item) => item.pop)),
  }
}

function summarizeNow(
  current: OwmCurrentResponse,
  date: string,
  forecast: OwmForecastResponse,
): DailySummary {
  return {
    date,
    time: current.dt,
    min: Math.min(current.main.temp, current.main.temp_min),
    max: Math.max(current.main.temp, current.main.temp_max),
    condition: toCondition(current.weather[0]),
    precipitationChance: forecast.list[0]?.pop ?? 0,
  }
}

export function mapDaily(
  current: OwmCurrentResponse,
  forecast: OwmForecastResponse,
  days = DAILY_DAYS,
): DailySummary[] {
  const offset = forecast.city.timezone
  const today = localDateKey(current.dt, offset)
  const summaries = [...groupByLocalDate(forecast.list, offset)].map((group) =>
    summarizeDay(group, offset, group[0] === today ? [current.main.temp] : []),
  )

  if (summaries[0]?.date !== today) summaries.unshift(summarizeNow(current, today, forecast))

  return summaries.slice(0, days)
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
