import type { Condition, ConditionKind } from './types'
import type { OwmCondition } from '@/api/types'

/**
 * Maps an OpenWeatherMap condition code to the app's condition groups.
 * @see https://openweathermap.org/weather-conditions
 */
export function toConditionKind(id: number): ConditionKind {
  if (id >= 200 && id < 300) return 'thunderstorm'
  if (id >= 300 && id < 400) return 'drizzle'
  if (id >= 500 && id < 600) return 'rain'
  if (id >= 600 && id < 700) return 'snow'
  if (id >= 700 && id < 800) return 'mist'
  if (id === 800) return 'clear'
  if (id === 801) return 'few-clouds'
  return 'clouds'
}

export function toCondition(raw: OwmCondition | undefined): Condition {
  if (!raw) return { kind: 'clouds', description: '', isNight: false }
  return {
    kind: toConditionKind(raw.id),
    description: raw.description,
    // Icon codes end in "d" (day) or "n" (night), e.g. "01n".
    isNight: raw.icon.endsWith('n'),
  }
}
