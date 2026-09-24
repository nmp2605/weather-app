import axios from 'axios'

import { getApiKey } from '@/config/env'

export const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org'

/** Axios instance shared by every OpenWeatherMap call. */
export const http = axios.create({
  baseURL: OPENWEATHER_BASE_URL,
  timeout: 10_000,
})

// The key is read per request so tests (and hot reloads) always see the current value.
http.interceptors.request.use((config) => {
  config.params = { ...(config.params as Record<string, unknown>), appid: getApiKey() }
  return config
})
