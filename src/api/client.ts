import axios from 'axios'

import { getApiKey } from '@/config/env'

export const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org'

export const http = axios.create({
  baseURL: OPENWEATHER_BASE_URL,
  timeout: 10_000,
})

http.interceptors.request.use((config) => {
  config.params = { ...(config.params as Record<string, unknown>), appid: getApiKey() }
  return config
})
