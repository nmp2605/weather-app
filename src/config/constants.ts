import type { Location } from '@/domain/types'

export const DEFAULT_LOCATION: Readonly<Location> = Object.freeze({
  name: 'Goiânia',
  state: 'Goiás',
  country: 'BR',
  lat: -16.6869,
  lon: -49.2648,
})

export const GEOLOCATION_TIMEOUT_MS = 8_000
export const GEOLOCATION_MAX_AGE_MS = 10 * 60_000
export const AUTO_REFRESH_INTERVAL_MS = 10 * 60_000
export const CLOCK_TICK_MS = 30_000
export const SEARCH_DEBOUNCE_MS = 300
export const SEARCH_MIN_LENGTH = 2
export const SEARCH_RESULT_LIMIT = 5
export const SNACKBAR_DURATION_MS = 6_000
export const HOURLY_POINTS = 8
export const DAILY_DAYS = 5

export const LAST_LOCATION_STORAGE_KEY = 'boletim-do-tempo:last-location'
export const OPENWEATHER_SIGN_UP_URL = 'https://home.openweathermap.org/users/sign_up'
